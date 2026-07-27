import uuid
from typing import List, Optional
from sqlalchemy import String, ForeignKey, Boolean, JSON, Enum, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base
from app.core.crypto import EncryptedString


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    CLINIC_OWNER = "clinic_owner"
    RECEPTIONIST = "receptionist"
    DOCTOR = "doctor"
    OFFICE_MANAGER = "office_manager"
    MARKETING = "marketing"
    BILLING = "billing"
    VIEWER = "viewer"


class PmsType(str, enum.Enum):
    DENTRIX = "dentrix"
    OPEN_DENTAL = "open_dental"
    EAGLESOFT = "eaglesoft"
    OTHER = "other"
    NONE = "none"


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    uuid: Mapped[str] = mapped_column(
        String(36),
        default=lambda: str(uuid.uuid4()),
        unique=True,
        index=True,
        nullable=False,
    )
    clinic_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    business_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    logo: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    timezone: Mapped[str] = mapped_column(
        String(50),
        default="America/New_York",
        nullable=False,
        server_default="America/New_York",
    )
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    country: Mapped[str] = mapped_column(String(50), default="US", nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    specialty: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    legal_business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    registration_number: Mapped[Optional[str]] = mapped_column(EncryptedString(255), nullable=True)
    tax_id: Mapped[Optional[str]] = mapped_column(EncryptedString(255), nullable=True)
    emergency_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    languages: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    subscription_plan: Mapped[str] = mapped_column(String(50), default="free", nullable=False)
    subscription_status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    max_users: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    max_locations: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    pms_type: Mapped[PmsType] = mapped_column(
        Enum(PmsType, values_callable=lambda x: [e.value for e in x]),
        default=PmsType.NONE,
        nullable=False,
        server_default=PmsType.NONE.value,
    )
    ai_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        server_default="true",
    )

    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="client",
        cascade="all, delete-orphan",
    )
    locations: Mapped[List["Location"]] = relationship(
        "Location",
        back_populates="client",
        cascade="all, delete-orphan",
    )
    settings: Mapped["ClientSettings"] = relationship(
        "ClientSettings",
        back_populates="client",
        cascade="all, delete-orphan",
        uselist=False,
    )

class Location(Base):
    __tablename__ = "locations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    location_name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    google_maps_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    manager_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    business_hours: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    client: Mapped["Client"] = relationship("Client", back_populates="locations")

class ClientSettings(Base):
    __tablename__ = "client_settings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    language: Mapped[str] = mapped_column(String(20), default="en", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="America/New_York", nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    business_hours: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    booking_rules: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ai_settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    notification_settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    client: Mapped["Client"] = relationship("Client", back_populates="settings")



class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(128),
        primary_key=True,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    first_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    last_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        nullable=False,
    )
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_suspended: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    two_factor_secret: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    backup_codes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_login: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="America/New_York", nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    client: Mapped[Optional["Client"]] = relationship(
        "Client",
        back_populates="users",
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    password_resets: Mapped[List["PasswordReset"]] = relationship(
        "PasswordReset",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    email_verifications: Mapped[List["EmailVerification"]] = relationship(
        "EmailVerification",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    details: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="audit_logs",
    )


# ─── Call Tracking Models ────────────────────────────────────────────────────

class CallStatus(str, enum.Enum):
    MISSED = "missed"
    QUEUED = "queued"
    CALLING_BACK = "calling_back"
    RECOVERED = "recovered"
    FAILED = "failed"


class CallDirection(str, enum.Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class AttemptOutcome(str, enum.Enum):
    NO_ANSWER = "no_answer"
    VOICEMAIL = "voicemail"
    CONNECTED = "connected"
    DECLINED = "declined"


class Call(Base):
    __tablename__ = "calls"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    call_sid: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )
    from_number: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    to_number: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[CallStatus] = mapped_column(
        Enum(CallStatus),
        default=CallStatus.MISSED,
        nullable=False,
        index=True,
    )
    direction: Mapped[CallDirection] = mapped_column(
        Enum(CallDirection),
        default=CallDirection.INBOUND,
        nullable=False,
    )
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    recording_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    revenue_estimate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    attempts: Mapped[List["CallAttempt"]] = relationship(
        "CallAttempt",
        back_populates="call",
        cascade="all, delete-orphan",
        order_by="CallAttempt.attempt_number",
    )


class CallAttempt(Base):
    __tablename__ = "call_attempts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    call_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("calls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    outcome: Mapped[Optional[AttemptOutcome]] = mapped_column(
        Enum(AttemptOutcome),
        nullable=True,
    )
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    call: Mapped["Call"] = relationship("Call", back_populates="attempts")


# ─── Appointment Model ────────────────────────────────────────────────────────

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ai_session_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("conversation_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    call_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("calls.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Patient info
    patient_name: Mapped[str] = mapped_column(String(200), nullable=False)
    patient_phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    patient_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    # Appointment info
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus, values_callable=lambda x: [e.value for e in x]),
        default=AppointmentStatus.SCHEDULED,
        nullable=False,
        index=True,
    )
    scheduled_at: Mapped[str] = mapped_column(String(50), nullable=False, index=True)   # ISO datetime string
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    treatment_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    provider_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    pms_appointment_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    revenue_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


# ─── RBAC & User Management Tables ────────────────────────────────────────────

class Role(Base):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Relationships
    permissions: Mapped[List["Permission"]] = relationship(
        "Permission", secondary="role_permissions", back_populates="roles"
    )


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Relationships
    roles: Mapped[List["Role"]] = relationship(
        "Role", secondary="role_permissions", back_populates="permissions"
    )


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )
    permission_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True
    )


class UserRoleLink(Base):
    __tablename__ = "user_roles"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    refresh_token: Mapped[str] = mapped_column(String(500), unique=True, index=True, nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    device_info: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_active: Mapped[str] = mapped_column(String(50), nullable=False)   # ISO datetime string
    expires_at: Mapped[str] = mapped_column(String(50), nullable=False)    # ISO datetime string

    user: Mapped["User"] = relationship("User", back_populates="sessions")


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    expires_at: Mapped[str] = mapped_column(String(50), nullable=False)    # ISO datetime string
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="password_resets")


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    expires_at: Mapped[str] = mapped_column(String(50), nullable=False)    # ISO datetime string
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="email_verifications")




from app.models.clinic import *
from app.models.developer import *

# Import AI brain models so Alembic discovers them
from app.ai.models import (  # noqa: F401, E402
    AIProfile,
    VoiceProfile,
    KnowledgeSource,
    KnowledgeChunk,
    ConversationSession,
    ConversationMessage,
    ConversationStateRecord,
    LeadExtraction,
    IntentHistory,
    PromptVersion,
    ConversationScore,
)

# Import Communication Hub models
from app.communication.models import (  # noqa: F401, E402
    CommunicationChannel,
    ConversationThread,
    InteractionMessage,
    CallRecord,
    MessageTemplate,
    HandoffEvent,
)

# Marketing Models
from app.marketing.models.marketing import *


# Super Admin Models
from app.admin.models.admin import *


# AI Studio Models
from app.ai_studio.models.studio import *

