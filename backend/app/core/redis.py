from typing import AsyncGenerator, Optional
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.logger import logger

# Global Redis client holder
redis_client: Optional[aioredis.Redis] = None


async def init_redis_pool() -> Optional[aioredis.Redis]:
    global redis_client
    try:
        logger.info("Initializing Redis connection pool...")
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=5.0,
        )
        # Verify connection
        await redis_client.ping()
        logger.info("Redis connection established successfully.")
        return redis_client
    except Exception as e:
        logger.warning(
            "Redis unavailable — server will start in degraded mode.",
            error=str(e),
        )
        redis_client = None
        return None


async def close_redis_pool() -> None:
    global redis_client
    if redis_client:
        logger.info("Closing Redis connection pool...")
        await redis_client.close()
        logger.info("Redis connection pool closed.")


async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    global redis_client
    if redis_client is None:
        await init_redis_pool()
    yield redis_client


async def get_redis_client() -> Optional[aioredis.Redis]:
    global redis_client
    if redis_client is None:
        await init_redis_pool()
    return redis_client
