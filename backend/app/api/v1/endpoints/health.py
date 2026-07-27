import time
from typing import Optional
from fastapi import APIRouter, Depends, status
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import os

from app.core.database import get_db
from app.core.redis import get_redis
from app.core.logger import logger

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
async def check_health(
    db: AsyncSession = Depends(get_db),
    redis_client: Optional[Redis] = Depends(get_redis),
):
    """
    Checks system status including Database and Redis connectivity.
    """
    db_status = "healthy"
    redis_status = "healthy"
    details = {}

    # Check database
    try:
        start_time = time.time()
        await db.execute(text("SELECT 1"))
        details["database_latency_ms"] = round((time.time() - start_time) * 1000, 2)
    except Exception as e:
        logger.error("Health check - database query failed", error=str(e))
        db_status = "unhealthy"
        details["database_error"] = str(e)

    # Check redis
    if redis_client is None:
        redis_status = "unhealthy"
        details["redis_error"] = "Redis is not connected (server started in degraded mode)"
    else:
        try:
            start_time = time.time()
            await redis_client.ping()
            details["redis_latency_ms"] = round((time.time() - start_time) * 1000, 2)
        except Exception as e:
            logger.error("Health check - redis ping failed", error=str(e))
            redis_status = "unhealthy"
            details["redis_error"] = str(e)

    # Check Minio
    minio_status = "healthy"
    minio_endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    try:
        start_time = time.time()
        async with httpx.AsyncClient() as client:
            res = await client.get(f"http://{minio_endpoint}/minio/health/live", timeout=2.0)
            if res.status_code == 200:
                details["minio_latency_ms"] = round((time.time() - start_time) * 1000, 2)
            else:
                minio_status = "unhealthy"
                details["minio_error"] = f"HTTP {res.status_code}"
    except Exception as e:
        logger.error("Health check - minio ping failed", error=str(e))
        minio_status = "unhealthy"
        details["minio_error"] = str(e)

    overall_status = "healthy"
    if db_status == "unhealthy" or redis_status == "unhealthy" or minio_status == "unhealthy":
        overall_status = "degraded"

    return {
        "status": overall_status,
        "services": {
            "database": db_status,
            "redis": redis_status,
            "minio": minio_status,
        },
        "details": details,
    }
