"""
RevFlow AI Brain — All AI-related SQLAlchemy models.
All tables enforce client_id (multi-tenant isolation).
"""
import uuid
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Boolean, JSON, Integer, Float, Text, Enum, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class VoiceGender(str, enum.Enum):
    FEMALE = "female"
    MALE = "male"
    PROFESSIONAL_FEMALE = "professional_female"
    PROFESSIONAL_MALE = "professional_male"
    FRIENDLY_FEMALE = "friendly_female"
    FRIENDLY_MALE = "friendly_male"
    SOFT_FEMALE = "soft_female"
    CALM_MALE = "calm_male"


class VoiceProvider(str, enum.Enum):
    GOOGLE_TTS = "google_tts"
    ELEVENLABS = "elevenlabs"
    CARTESIA = "cartesia"
    AZURE_SPEECH = "azure_speech"
    MOCK = "mock"


class VoiceLanguage(str, enum.Enum):
    ENGLISH_US = "en-US"
    ENGLISH_GB = "en-GB"
    ENGLISH_AU = "en-AU"
    ENGLISH_IN = "en-IN"
    SPANISH = "es-ES"
    FRENCH = "fr-FR"


class KnowledgeSourceType(str, enum.Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"
    WEBSITE = "website"
    FAQ = "faq"
    POLICY = "policy"
    INSURANCE = "insurance"
    PRICING = "pricing"
    DOCTOR_PROFILE = "doctor_profile"
    TREATMENT_GUIDE = "treatment_guide"
    PATIENT_INSTRUCTIONS = "patient_instructions"
    CONSENT_FORM = "consent_form"
    MARKETING = "marketing"


class KnowledgeSourceStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class ConversationState(str, enum.Enum):
    GREETING = "greeting"
    QUALIFICATION = "qualification"
    INFORMATION = "information"
    BOOKING = "booking"
    CONFIRMATION = "confirmation"
    ESCALATION = "escalation"
    FOLLOW_UP = "follow_up"
    COMPLETED = "completed"


class ConversationRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class IntentType(str, enum.Enum):
    APPOINTMENT = "appointment"
    PRICING = "pricing"
    INSURANCE = "insurance"
    EMERGENCY = "emergency"
    COMPLAINT = "complaint"
    FOLLOW_UP = "follow_up"
    CANCELLATION = "cancellation"
    RESCHEDULE = "reschedule"
    HUMAN_REQUEST = "human_request"
    GENERAL_QUESTION = "general_question"
    UNKNOWN = "unknown"


class PersonalityStyle(str, enum.Enum):
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    WARM = "warm"
    PREMIUM = "premium"
    EMPATHETIC = "empathetic"


class ResponseLength(str, enum.Enum):
    BRIEF = "brief"
    STANDARD = "standard"
    DETAILED = "detailed"


# ─── AI Profile ───────────────────────────────────────────────────────────────

class AIProfile(Base):
    """Per-clinic AI receptionist identity and behavior configuration."""
    __tablename__ = "ai_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,  # One AI profile per clinic
    )

    # Identity
    ai_name: Mapped[str] = mapped_column(String(100), default="Aria", nullable=False)
    receptionist_name: Mapped[str] = mapped_column(String(100), default="Aria", nullable=False)
    greeting_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Personality & Style
    personality: Mapped[PersonalityStyle] = mapped_column(
        Enum(PersonalityStyle, values_callable=lambda x: [e.value for e in x]),
        default=PersonalityStyle.PROFESSIONAL,
        nullable=False,
    )
    response_length: Mapped[ResponseLength] = mapped_column(
        Enum(ResponseLength, values_callable=lambda x: [e.value for e in x]),
        default=ResponseLength.STANDARD,
        nullable=False,
    )

    # Rules (stored as text for flexibility)
    emergency_rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    escalation_rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    booking_rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    business_rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    insurance_rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    appointment_rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


# ─── Voice Profile ────────────────────────────────────────────────────────────

class VoiceProfile(Base):
    """Per-clinic TTS voice configuration."""
    __tablename__ = "voice_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )

    voice_gender: Mapped[VoiceGender] = mapped_column(
        Enum(VoiceGender, values_callable=lambda x: [e.value for e in x]),
        default=VoiceGender.PROFESSIONAL_FEMALE,
        nullable=False,
    )
    provider: Mapped[VoiceProvider] = mapped_column(
        Enum(VoiceProvider, values_callable=lambda x: [e.value for e in x]),
        default=VoiceProvider.GOOGLE_TTS,
        nullable=False,
    )
    language: Mapped[VoiceLanguage] = mapped_column(
        Enum(VoiceLanguage, values_callable=lambda x: [e.value for e in x]),
        default=VoiceLanguage.ENGLISH_US,
        nullable=False,
    )
    speaking_speed: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    speaking_style: Mapped[str] = mapped_column(String(50), default="professional", nullable=False)
    provider_voice_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # e.g. ElevenLabs voice ID
    provider_api_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Encrypted in prod


# ─── Knowledge Base ───────────────────────────────────────────────────────────

class KnowledgeSource(Base):
    """A document/URL uploaded to a clinic's knowledge base."""
    __tablename__ = "knowledge_sources"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[KnowledgeSourceType] = mapped_column(
        Enum(KnowledgeSourceType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    status: Mapped[KnowledgeSourceStatus] = mapped_column(
        Enum(KnowledgeSourceStatus, values_callable=lambda x: [e.value for e in x]),
        default=KnowledgeSourceStatus.PENDING,
        nullable=False,
    )
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)   # Local/S3 path
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # For website type
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    character_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    chunks: Mapped[List["KnowledgeChunk"]] = relationship(
        "KnowledgeChunk",
        back_populates="source",
        cascade="all, delete-orphan",
    )


class KnowledgeChunk(Base):
    """A text chunk extracted from a knowledge source, with embedding."""
    __tablename__ = "knowledge_chunks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("knowledge_sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # float list stored as JSON
    token_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationship
    source: Mapped["KnowledgeSource"] = relationship("KnowledgeSource", back_populates="chunks")


# ─── Conversations ────────────────────────────────────────────────────────────

class ConversationSession(Base):
    """An AI conversation session linked to a call."""
    __tablename__ = "conversation_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    call_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("calls.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Patient memory
    patient_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    patient_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    patient_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    patient_insurance: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Session metadata
    current_state: Mapped[ConversationState] = mapped_column(
        Enum(ConversationState, values_callable=lambda x: [e.value for e in x]),
        default=ConversationState.GREETING,
        nullable=False,
    )
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lead_status: Mapped[str] = mapped_column(String(50), default="new", nullable=False)
    total_messages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    messages: Mapped[List["ConversationMessage"]] = relationship(
        "ConversationMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ConversationMessage.created_at",
    )
    state_history: Mapped[List["ConversationStateRecord"]] = relationship(
        "ConversationStateRecord",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    lead_extraction: Mapped[Optional["LeadExtraction"]] = relationship(
        "LeadExtraction",
        back_populates="session",
        cascade="all, delete-orphan",
        uselist=False,
    )
    score: Mapped[Optional["ConversationScore"]] = relationship(
        "ConversationScore",
        back_populates="session",
        cascade="all, delete-orphan",
        uselist=False,
    )


class ConversationMessage(Base):
    """A single message in a conversation session."""
    __tablename__ = "conversation_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role: Mapped[ConversationRole] = mapped_column(
        Enum(ConversationRole, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    detected_intent: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    rag_chunks_used: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # chunk IDs used
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationship
    session: Mapped["ConversationSession"] = relationship("ConversationSession", back_populates="messages")


class ConversationStateRecord(Base):
    """Tracks state machine transitions for a session."""
    __tablename__ = "conversation_states"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    to_state: Mapped[str] = mapped_column(String(50), nullable=False)
    trigger: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    session: Mapped["ConversationSession"] = relationship("ConversationSession", back_populates="state_history")


# ─── Lead Extraction ──────────────────────────────────────────────────────────

class LeadExtraction(Base):
    """Structured lead data extracted from a conversation."""
    __tablename__ = "lead_extractions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    procedure: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    preferred_date: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    insurance: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    urgency: Mapped[str] = mapped_column(String(50), default="normal", nullable=False)
    raw_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Full extraction result

    session: Mapped["ConversationSession"] = relationship("ConversationSession", back_populates="lead_extraction")


# ─── Intent History ───────────────────────────────────────────────────────────

class IntentHistory(Base):
    """Intent classification history per message."""
    __tablename__ = "intent_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    message_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversation_messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    intent: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    secondary_intents: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


# ─── Prompt Versions ──────────────────────────────────────────────────────────

class PromptVersion(Base):
    """Version-controlled prompt templates per clinic."""
    __tablename__ = "prompt_versions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


# ─── Conversation Quality Score ───────────────────────────────────────────────

class ConversationScore(Base):
    """Quality scoring for a completed conversation."""
    __tablename__ = "conversation_scores"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Score components (0–100)
    accuracy_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    empathy_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    professionalism_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    booking_success_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    knowledge_usage_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    score_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    session: Mapped["ConversationSession"] = relationship("ConversationSession", back_populates="score")
