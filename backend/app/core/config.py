import json
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "RevFlow AI"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3003",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        return v

    # Databases
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/revflow"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Twilio — all optional; set to enable real phone/SMS features
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None   # E.164 format: +15551234567
    TWILIO_FLOW_SID: Optional[str] = None       # Studio Flow SID: FWxxxxxxxxxxxx

    # Public base URL that Twilio can reach for webhooks.
    # Locally: use ngrok URL e.g. https://abc123.ngrok.io
    # Production: e.g. https://api.revflow.ai
    WEBHOOK_BASE_URL: Optional[str] = None

    @property
    def twilio_enabled(self) -> bool:
        return bool(self.TWILIO_ACCOUNT_SID and self.TWILIO_AUTH_TOKEN and self.TWILIO_PHONE_NUMBER)

    @property
    def studio_flow_enabled(self) -> bool:
        """True when a Studio Flow SID is configured — preferred over raw calls."""
        return bool(self.twilio_enabled and self.TWILIO_FLOW_SID)

    @property
    def inbound_webhook_url(self) -> str:
        base = self.WEBHOOK_BASE_URL or "http://localhost:8000"
        return f"{base.rstrip('/')}/api/v1/calls/webhook/inbound"

    @property
    def media_stream_url(self) -> str:
        base = self.WEBHOOK_BASE_URL or "http://localhost:8000"
        # Convert http(s) to ws(s)
        if base.startswith("https://"):
            base = base.replace("https://", "wss://", 1)
        elif base.startswith("http://"):
            base = base.replace("http://", "ws://", 1)
        return f"{base.rstrip('/')}/api/v1/calls/media-stream"

    @property
    def status_callback_url(self) -> str:
        base = self.WEBHOOK_BASE_URL or "http://localhost:8000"
        return f"{base.rstrip('/')}/api/v1/calls/webhook/status"

    @property
    def twiml_callback_url(self) -> str:
        base = self.WEBHOOK_BASE_URL or "http://localhost:8000"
        return f"{base.rstrip('/')}/api/v1/calls/twiml/callback"

    # Gemini AI — optional; set to enable real AI conversation engine
    GEMINI_API_KEY: Optional[str] = None

    @property
    def gemini_enabled(self) -> bool:
        return bool(self.GEMINI_API_KEY)

    # Groq AI — optional; set to enable Llama 3 via Groq
    GROQ_API_KEY: Optional[str] = None

    @property
    def groq_enabled(self) -> bool:
        return bool(self.GROQ_API_KEY)

    # PMS Integration — encryption key for storing credentials securely
    # Auto-generates a dev key if not set. MUST be set in production.
    INTEGRATION_ENCRYPTION_KEY: Optional[str] = None
    INTEGRATION_WEBHOOK_SECRET: str = "revflow-webhook-secret-dev"

    @property
    def integration_encryption_key_bytes(self) -> bytes:
        """Returns a valid Fernet key (32-byte URL-safe base64)."""
        import base64
        import hashlib
        if self.INTEGRATION_ENCRYPTION_KEY:
            raw = self.INTEGRATION_ENCRYPTION_KEY.encode()
        else:
            raw = b"revflow-dev-encryption-key-insecure"
        # Derive a 32-byte key from the raw secret using SHA-256
        derived = hashlib.sha256(raw).digest()
        return base64.urlsafe_b64encode(derived)

    # Logging
    LOG_LEVEL: str = "info"

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
