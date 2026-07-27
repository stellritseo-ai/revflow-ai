"""
Authentication & Authorization Security Service.

Implements:
1. Hashing and verifying passwords with bcrypt.
2. Generating JWT Access Tokens & Refresh Tokens.
3. Locking accounts on brute force attempts using Redis cache.
4. Validating and parsing session contexts.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import bcrypt
from jose import jwt, JWTError
import structlog
from app.core.config import settings
from app.core.redis import get_redis_client

logger = structlog.get_logger()

# JWT configuration
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7
JWT_SECRET_KEY = settings.SECRET_KEY if hasattr(settings, "SECRET_KEY") else "revflow_production_auth_key_998877"
ALGORITHM = "HS256"

# Brute force rules
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


# ─── Password Validation & Hashing ──────────────────────────────────────────────

def validate_password_strength(password: str) -> None:
    """
    Validates password against enterprise strength requirements:
    - At least 12 characters
    - Contains uppercase letter
    - Contains lowercase letter
    - Contains number
    - Contains special character
    """
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters long")
    if not any(char.isupper() for char in password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(char.islower() for char in password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(char.isdigit() for char in password):
        raise ValueError("Password must contain at least one number")
    if not any(not char.isalnum() for char in password):
        raise ValueError("Password must contain at least one special character")

def get_password_hash(password: str) -> str:
    """Hashes a plain password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against its bcrypt hash."""
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


# ─── JWT Generation ───────────────────────────────────────────────────────────

def create_access_token(user_id: str, email: str, role: str) -> str:
    """Generates a JWT access token valid for 60 minutes."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": int(expire.timestamp()),
        "iss": "revflow-auth",
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=ALGORITHM)


def generate_secure_token() -> str:
    """Generates a random high-entropy token for verification and resets."""
    import secrets
    return secrets.token_urlsafe(32)


# ─── Brute Force / Lockout Management ─────────────────────────────────────────

async def check_login_lockout(email: str) -> Tuple[bool, int]:
    """
    Checks if a login attempt is blocked due to excessive failures.
    Returns (is_locked, remaining_seconds).
    """
    redis = await get_redis_client()
    if not redis:
        return False, 0

    key = f"lockout:{email}"
    lock_val = await redis.get(key)
    if lock_val:
        ttl = await redis.ttl(key)
        return True, max(0, ttl)

    return False, 0


async def record_login_attempt(email: str, success: bool) -> Optional[int]:
    """
    Increments failed attempts on failure. Resets on success.
    Returns locked_minutes if account gets locked, or None.
    """
    redis = await get_redis_client()
    if not redis:
        return None

    attempts_key = f"attempts:{email}"
    lockout_key = f"lockout:{email}"

    if success:
        await redis.delete(attempts_key)
        return None

    # Increment failure count
    attempts = await redis.incr(attempts_key)
    if attempts == 1:
        # Expiry to clear old failed attempts count if they don't brute force
        await redis.expire(attempts_key, 86400) # 1 day

    if attempts >= MAX_FAILED_ATTEMPTS:
        # Lock account in Redis for 15 minutes
        await redis.set(lockout_key, "locked", ex=LOCKOUT_MINUTES * 60)
        await redis.delete(attempts_key)
        logger.warning("Account locked out due to brute force protection", email=email)
        return LOCKOUT_MINUTES

    return None
