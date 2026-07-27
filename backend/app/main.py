import time
import uuid
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logger import setup_logging, logger
from app.communication import models as communication_models
from app.integrations import models as integration_models
from app.scheduling import models as scheduling_models
from app.revenue import models as revenue_models
from app.analytics import models as analytics_models
from app.core.exceptions import register_exception_handlers
from app.core.redis import init_redis_pool, close_redis_pool, get_redis_client
from app.api.api import api_router

from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi import Response

def tenant_key_builder(
    func,
    namespace: str = "",
    request: Request = None,
    response: Response = None,
    *args,
    **kwargs,
):
    tenant_id = "global"
    if "ctx" in kwargs and hasattr(kwargs["ctx"], "client_id"):
        tenant_id = str(kwargs["ctx"].client_id)
    elif "current_user" in kwargs and hasattr(kwargs["current_user"], "client_id"):
        tenant_id = str(kwargs["current_user"].client_id)
    
    path = request.url.path if request else ""
    return f"{namespace}:{tenant_id}:{path}"

try:
    import sentry_sdk
    from opentelemetry import trace
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
    from prometheus_client import make_asgi_app

    # 1. Initialize Sentry (using a placeholder DSN for staging/prod)
    sentry_sdk.init(
        dsn="https://mock@o0.ingest.sentry.io/0",
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

    # 2. Initialize OpenTelemetry
    trace.set_tracer_provider(TracerProvider())
    tracer_provider = trace.get_tracer_provider()
    # In a real environment, you'd use OTLPSpanExporter. Here we use Console for demonstration/mock.
    tracer_provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
    HAS_OBSERVABILITY = True
except ImportError:
    HAS_OBSERVABILITY = False

# ─── Security Middlewares ──────────────────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Prevent Clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Strict Transport Security (HSTS)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        # Content Security Policy (Basic)
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:;"
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Permissions Policy
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # We only rate limit specific high-risk paths globally or use an IP-based global sliding window
        client_ip = request.client.host if request.client else "unknown"
        redis = await get_redis_client()
        
        if redis and not request.url.path.startswith("/docs") and not request.url.path.startswith("/openapi.json"):
            # Global limit: 300 requests per minute per IP
            key = f"ratelimit:global:{client_ip}"
            requests_count = await redis.incr(key)
            if requests_count == 1:
                await redis.expire(key, 60)
                
            if requests_count > 300:
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."}
                )
        
        return await call_next(request)



# Middleware for injecting a Request ID and structured log profiling
class LogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

        # Use contextvars-based binding so it is safe across async boundaries
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )

        start_time = time.time()
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{process_time:.4f}s"

            logger.info(
                "Request processed successfully",
                status_code=response.status_code,
                duration_ms=round(process_time * 1000, 2),
            )
            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                "Request failed with unhandled exception",
                error=str(e),
                duration_ms=round(process_time * 1000, 2),
            )
            raise
        finally:
            structlog.contextvars.clear_contextvars()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    setup_logging()
    logger.info("Starting up RevFlow AI API Backend...")

    # Auto-apply any pending database migrations at startup
    try:
        from app.models.models import Base
        import app.scheduling.models # Register scheduling models
        from app.core.database import engine
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS ai_session_id UUID;"))
            logger.info("Database tables & ai_session_id column verified via create_all")
    except Exception as e:
        logger.error("Failed to run create_all", error=str(e))

    try:
        import subprocess
        import os
        import sys
        # Find alembic next to the current Python executable (same venv)
        alembic_bin = os.path.join(os.path.dirname(sys.executable), "alembic")
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        # main.py lives in app/, alembic.ini lives in backend/
        project_dir = os.path.dirname(backend_dir)
        result = subprocess.run(
            [alembic_bin, "upgrade", "head"],
            cwd=project_dir,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            logger.info("Database migrations applied", output=result.stdout.strip())
        else:
            logger.warning("Migration warning", stderr=result.stderr.strip())
    except Exception as e:
        logger.warning("Could not run auto-migrations", error=str(e))

    # Init redis pool
    await init_redis_pool()
    redis_client = await get_redis_client()
    if redis_client:
        FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache", key_builder=tenant_key_builder)
        logger.info("FastAPICache initialized with Redis backend")

    yield

    # Shutdown actions
    logger.info("Shutting down RevFlow AI API Backend...")
    await close_redis_pool()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

if HAS_OBSERVABILITY:
    # Instrument FastAPI with OpenTelemetry
    FastAPIInstrumentor.instrument_app(app)

    # Expose Prometheus Metrics endpoint
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)

# Apply middlewares
app.add_middleware(LogMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register custom exception mappings
register_exception_handlers(app)

# Include APIs routing
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/debug-slots")
async def debug_slots():
    from app.models.models import Base
    import app.scheduling.models
    from app.core.database import engine
    from sqlalchemy import text
    import traceback
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS ai_session_id UUID"))
        return {"status": "success", "tables_created": True}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/")
async def root_redirect():
    """
    Root API endpoint returning system banner and doc link.
    """
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "documentation": "/docs",
        "status": "operational"
    }
