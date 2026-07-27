"""
PMS Integration Hub — All database models.
Supports multi-tenant credential management, sync tracking, and audit logging.
"""
import uuid
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, ForeignKey, Boolean, JSON, Integer, Text, Enum, Float, DateTime, Uuid
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.base import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class PMSProvider(str, enum.Enum):
    OPEN_DENTAL = "open_dental"
    DENTRIX = "dentrix"
    EAGLESOFT = "eaglesoft"
    CURVE_DENTAL = "curve_dental"
    DENTICON = "denticon"
    CARESTACK = "carestack"
    PLANET_DDS = "planet_dds"
    MOCK = "mock"


class AuthMethod(str, enum.Enum):
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    USERNAME_PASSWORD = "username_password"
    NONE = "none"


class SyncJobStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


class SyncType(str, enum.Enum):
    FULL = "full"
    INCREMENTAL = "incremental"
    MANUAL = "manual"
    WEBHOOK = "webhook"
    SCHEDULED = "scheduled"


class SyncModule(str, enum.Enum):
    PATIENTS = "patients"
    APPOINTMENTS = "appointments"
    PROVIDERS = "providers"
    INSURANCE = "insurance"
    TREATMENT_PLANS = "treatment_plans"
    PROCEDURES = "procedures"
    SCHEDULES = "schedules"
    OPERATORIES = "operatories"
    ALL = "all"


class ConflictResolution(str, enum.Enum):
    KEEP_PMS = "keep_pms"
    KEEP_REVFLOW = "keep_revflow"
    MERGE = "merge"
    ASK_USER = "ask_user"


class WebhookEvent(str, enum.Enum):
    APPOINTMENT_CREATED = "appointment.created"
    APPOINTMENT_UPDATED = "appointment.updated"
    APPOINTMENT_CANCELLED = "appointment.cancelled"
    PATIENT_UPDATED = "patient.updated"
    PROVIDER_UPDATED = "provider.updated"
    SCHEDULE_CHANGED = "schedule.changed"


def _new_id() -> str:
    return str(uuid.uuid4())


# ─── Models ────────────────────────────────────────────────────────────────────

class IntegrationCredential(Base):
    """
    Encrypted PMS credentials per clinic.
    Secrets are NEVER stored in plaintext — all values are Fernet-encrypted.
    """
    __tablename__ = "integration_credentials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)

    provider: Mapped[PMSProvider] = mapped_column(
        Enum(PMSProvider, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    auth_method: Mapped[AuthMethod] = mapped_column(
        Enum(AuthMethod, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AuthMethod.API_KEY,
    )
    environment: Mapped[str] = mapped_column(String(20), default="production")  # "sandbox" | "production"

    # Encrypted credential fields (stored as Fernet-encrypted bytes)
    api_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_username: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_password: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_client_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Connection state
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verification_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Sync config
    default_conflict_resolution: Mapped[ConflictResolution] = mapped_column(
        Enum(ConflictResolution, values_callable=lambda x: [e.value for e in x]),
        default=ConflictResolution.KEEP_PMS,
    )
    sync_interval_minutes: Mapped[int] = mapped_column(Integer, default=60)
    auto_sync_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class IntegrationSyncJob(Base):
    """Tracks each sync execution — status, progress, results."""
    __tablename__ = "integration_sync_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    credential_id: Mapped[str] = mapped_column(String(36), ForeignKey("integration_credentials.id"), nullable=False)

    provider: Mapped[PMSProvider] = mapped_column(
        Enum(PMSProvider, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    sync_type: Mapped[SyncType] = mapped_column(
        Enum(SyncType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    module: Mapped[SyncModule] = mapped_column(
        Enum(SyncModule, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=SyncModule.ALL,
    )
    status: Mapped[SyncJobStatus] = mapped_column(
        Enum(SyncJobStatus, values_callable=lambda x: [e.value for e in x]),
        default=SyncJobStatus.QUEUED,
    )

    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Results
    records_synced: Mapped[int] = mapped_column(Integer, default=0)
    records_created: Mapped[int] = mapped_column(Integer, default=0)
    records_updated: Mapped[int] = mapped_column(Integer, default=0)
    records_skipped: Mapped[int] = mapped_column(Integer, default=0)
    errors_count: Mapped[int] = mapped_column(Integer, default=0)
    warnings_count: Mapped[int] = mapped_column(Integer, default=0)

    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    triggered_by: Mapped[str] = mapped_column(String(100), default="system")  # "user", "scheduler", "webhook"
    retry_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class IntegrationSyncLog(Base):
    """Per-record sync log entries."""
    __tablename__ = "integration_sync_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("integration_sync_jobs.id"), nullable=False)

    level: Mapped[str] = mapped_column(String(10), default="info")  # info | warning | error
    module: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    record_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # PMS record ID
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class IntegrationWebhook(Base):
    """Webhook endpoint config for receiving real-time PMS events."""
    __tablename__ = "integration_webhooks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    credential_id: Mapped[str] = mapped_column(String(36), ForeignKey("integration_credentials.id"), nullable=False)

    provider: Mapped[PMSProvider] = mapped_column(
        Enum(PMSProvider, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    event_type: Mapped[WebhookEvent] = mapped_column(
        Enum(WebhookEvent, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    endpoint_url: Mapped[str] = mapped_column(Text, nullable=False)  # Our receiving URL
    signing_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # HMAC secret
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_received_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class IntegrationFieldMapping(Base):
    """Custom field mapping between PMS fields and RevFlow fields."""
    __tablename__ = "integration_field_mapping"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    credential_id: Mapped[str] = mapped_column(String(36), ForeignKey("integration_credentials.id"), nullable=False)

    module: Mapped[str] = mapped_column(String(50), nullable=False)  # "patients", "appointments"
    pms_field: Mapped[str] = mapped_column(String(255), nullable=False)
    revflow_field: Mapped[str] = mapped_column(String(255), nullable=False)
    transform: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # "upper", "date_format", etc.
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class IntegrationConflict(Base):
    """Records data conflicts between PMS and RevFlow with resolution decisions."""
    __tablename__ = "integration_conflicts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("integration_sync_jobs.id"), nullable=False)

    module: Mapped[str] = mapped_column(String(50), nullable=False)
    record_id: Mapped[str] = mapped_column(String(255), nullable=False)
    field_name: Mapped[str] = mapped_column(String(255), nullable=False)
    pms_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    revflow_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    resolution: Mapped[ConflictResolution] = mapped_column(
        Enum(ConflictResolution, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    resolved_by: Mapped[str] = mapped_column(String(100), default="auto")  # "auto" | user_id
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class IntegrationError(Base):
    """Detailed error log per sync record for retry management."""
    __tablename__ = "integration_errors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("integration_sync_jobs.id"), nullable=False)

    error_type: Mapped[str] = mapped_column(String(100), nullable=False)  # auth_error, rate_limit, network, schema, invalid_data
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    record_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    module: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    stack_trace: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    is_retried: Mapped[bool] = mapped_column(Boolean, default=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
