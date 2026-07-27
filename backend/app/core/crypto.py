import os
from cryptography.fernet import Fernet
from app.core.config import settings

# In production, this should be a strong base64-encoded 32-byte key
# Fallback provided for local development
ENCRYPTION_KEY = os.getenv("FERNET_ENCRYPTION_KEY", "uE1hG_q34G9m-L8G_eZ9x3d2P_vO7G4_G-F8gYg_p3U=")
cipher_suite = Fernet(ENCRYPTION_KEY.encode('utf-8'))

def encrypt_data(data: str) -> str:
    """Encrypts a string using Fernet symmetric encryption."""
    if not data:
        return data
    return cipher_suite.encrypt(data.encode('utf-8')).decode('utf-8')

def decrypt_data(token: str) -> str:
    """Decrypts a Fernet encrypted string."""
    if not token:
        return token
    try:
        return cipher_suite.decrypt(token.encode('utf-8')).decode('utf-8')
    except Exception:
        # If decryption fails (e.g. key rotation mismatch), log error and return original
        # Real-world apps handle key rotation gracefully
        return token

from sqlalchemy.types import TypeDecorator, String

class EncryptedString(TypeDecorator):
    """
    SQLAlchemy TypeDecorator that encrypts a string before saving to DB
    and decrypts it when retrieving from DB.
    """
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return encrypt_data(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return decrypt_data(value)
        return value
