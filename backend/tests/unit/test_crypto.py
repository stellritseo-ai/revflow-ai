import pytest
from app.core.crypto import get_password_hash, verify_password
from app.core.security import create_access_token
import jwt
from app.core.config import settings

def test_password_hashing():
    password = "SuperSecretPassword123!"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_create_access_token():
    data = {"sub": "user_id_123", "role": "admin"}
    token = create_access_token(data)
    
    # Verify the token can be decoded
    decoded = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert decoded["sub"] == "user_id_123"
    assert decoded["role"] == "admin"
    assert "exp" in decoded
