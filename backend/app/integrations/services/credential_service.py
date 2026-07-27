"""
Credential Service — Fernet symmetric encryption for PMS API credentials.
All secrets are encrypted before storage. Never stored in plaintext.
"""
from __future__ import annotations
from cryptography.fernet import Fernet
from app.core.config import settings


def _get_fernet() -> Fernet:
    """Return a Fernet instance using the configured encryption key."""
    return Fernet(settings.integration_encryption_key_bytes)


def encrypt(plaintext: str) -> str:
    """Encrypt a plaintext secret. Returns base64-encoded ciphertext string."""
    if not plaintext:
        return ""
    fernet = _get_fernet()
    return fernet.encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    """Decrypt an encrypted secret. Returns plaintext string."""
    if not ciphertext:
        return ""
    try:
        fernet = _get_fernet()
        return fernet.decrypt(ciphertext.encode()).decode()
    except Exception:
        return ""


def mask(value: str, visible: int = 4) -> str:
    """Return a masked version for display (e.g. '••••••••abcd')."""
    if not value or len(value) <= visible:
        return "••••••••"
    return "•" * (len(value) - visible) + value[-visible:]
