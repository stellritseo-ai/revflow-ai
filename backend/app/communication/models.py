"""
Communication Hub — Database Models
Multi-tenant architecture enforcing client_id.
"""
import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, Boolean, JSON, Integer, Text, Enum, Float, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base


class ChannelType(str, enum.Enum):
    VOICE = "voice"
    SMS = "sms"
    EMAIL = "email"
    CHAT = "chat"
    WHATSAPP = "whatsapp"
    FACEBOOK = "facebook"
    APPLE = "apple"
    GOOGLE = "google"


class ThreadStatus(str, enum.Enum):
    ACTIVE = "active"
    SNOOZED = "snoozed"
    RESOLVED = "resolved"
    ARCHIVED = "archived"


class CommunicationChannel(Base):
    """Configuration for specific communication inbound paths (e.g., a phone number)."""
    __tablename__ = "communication_channels"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(import_uuid()))
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    
    channel_type: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    identifier: Mapped[str] = mapped_column(String(255), nullable=False)  # Phone number, email address, widget id
    provider_name: Mapped[str] = mapped_column(String(100), nullable=False)  # twilio, sendgrid, custom
    provider_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class ConversationThread(Base):
    """The master timeline containing all interactions for a specific issue/timeframe."""
    __tablename__ = "conversation_threads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(import_uuid()))
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    patient_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ai_session_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("conversation_sessions.id"), nullable=True)

    primary_channel: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    status: Mapped[ThreadStatus] = mapped_column(
        Enum(ThreadStatus, values_callable=lambda x: [e.value for e in x]),
        default=ThreadStatus.ACTIVE,
    )
    is_assigned_to_human: Mapped[bool] = mapped_column(Boolean, default=False)
    assigned_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"priority": "high", "type": "billing"}


class InteractionMessage(Base):
    """A generic message table that stores the raw payload for ANY channel."""
    __tablename__ = "interaction_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(import_uuid()))
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    thread_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversation_threads.id"), nullable=False)
    
    channel: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    direction: Mapped[str] = mapped_column(String(10), nullable=False)  # "inbound" or "outbound"
    sender_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # phone number, email, patient name
    recipient_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    content: Mapped[str] = mapped_column(Text, nullable=False)
    attachments: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    provider_message_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    delivery_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class CallRecord(Base):
    """Metadata specifically for voice calls."""
    __tablename__ = "call_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(import_uuid()))
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    thread_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversation_threads.id"), nullable=False)
    
    direction: Mapped[str] = mapped_column(String(10), nullable=False)
    from_number: Mapped[str] = mapped_column(String(50), nullable=False)
    to_number: Mapped[str] = mapped_column(String(50), nullable=False)
    
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # completed, missed, voicemail
    
    recording_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    transcription_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cost: Mapped[float] = mapped_column(Float, default=0.0)


class MessageTemplate(Base):
    """Reusable templates for SMS/Email."""
    __tablename__ = "message_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(import_uuid()))
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    channel: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # For email
    body: Mapped[str] = mapped_column(Text, nullable=False)
    variables: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


class HandoffEvent(Base):
    """Audit log of when AI hands off to a human."""
    __tablename__ = "handoff_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(import_uuid()))
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id"), index=True, nullable=False)
    thread_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversation_threads.id"), nullable=False)
    
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    handled_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)


def import_uuid():
    import uuid
    return uuid.uuid4()
