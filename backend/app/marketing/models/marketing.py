import uuid
import enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, ForeignKey, Boolean, JSON, Enum, Integer, Float, Text, DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

class CampaignType(str, enum.Enum):
    EMAIL = "email"
    SMS = "sms"
    VOICE = "voice"
    CHAT = "chat"
    MULTI_STEP = "multi_step"

class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

class MarketingCampaign(Base):
    __tablename__ = "marketing_campaigns"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    campaign_type: Mapped[CampaignType] = mapped_column(Enum(CampaignType), nullable=False)
    status: Mapped[CampaignStatus] = mapped_column(Enum(CampaignStatus), default=CampaignStatus.DRAFT)
    
    subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # HTML or Text
    
    # Scheduling
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    schedule_cron: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    next_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # AI fields
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    target_audience_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    steps: Mapped[List["CampaignStep"]] = relationship("CampaignStep", back_populates="campaign", cascade="all, delete-orphan")


class CampaignStep(Base):
    __tablename__ = "marketing_campaign_steps"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("marketing_campaigns.id", ondelete="CASCADE"), nullable=False)
    
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    action_type: Mapped[CampaignType] = mapped_column(Enum(CampaignType), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    delay_minutes: Mapped[int] = mapped_column(Integer, default=0)
    
    campaign: Mapped["MarketingCampaign"] = relationship("MarketingCampaign", back_populates="steps")


class PatientSegment(Base):
    __tablename__ = "marketing_segments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Store rules as JSON (e.g., {"last_visit_days_ago": ">365", "tags": ["invisalign"]})
    rules: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    is_dynamic: Mapped[bool] = mapped_column(Boolean, default=True)


class PatientJourney(Base):
    __tablename__ = "marketing_journeys"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    trigger_event: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., "appointment_completed"
    status: Mapped[CampaignStatus] = mapped_column(Enum(CampaignStatus), default=CampaignStatus.DRAFT)
    
    # Store workflow graph/nodes as JSON
    workflow_definition: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class ReviewRequest(Base):
    __tablename__ = "marketing_review_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    
    channel: Mapped[str] = mapped_column(String(50), nullable=False) # email, sms
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    clicked: Mapped[bool] = mapped_column(Boolean, default=False)
    converted: Mapped[bool] = mapped_column(Boolean, default=False)


class Review(Base):
    __tablename__ = "marketing_reviews"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    source: Mapped[str] = mapped_column(String(50), nullable=False) # google, facebook, internal
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    requires_escalation: Mapped[bool] = mapped_column(Boolean, default=False)


class MarketingLead(Base):
    __tablename__ = "marketing_leads"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    source: Mapped[str] = mapped_column(String(100), nullable=False) # website, ad, referral
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("marketing_campaigns.id", ondelete="SET NULL"), nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default="new") # new, contacted, converted, lost
    ai_lead_score: Mapped[int] = mapped_column(Integer, default=50) # 0-100


class LandingPage(Base):
    __tablename__ = "marketing_landing_pages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    
    html_content: Mapped[Text] = mapped_column(Text, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    
    visits: Mapped[int] = mapped_column(Integer, default=0)
    conversions: Mapped[int] = mapped_column(Integer, default=0)


class SocialPost(Base):
    __tablename__ = "marketing_social_posts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    platform: Mapped[str] = mapped_column(String(50), nullable=False) # facebook, instagram, linkedin
    content: Mapped[Text] = mapped_column(Text, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    scheduled_for: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft") # draft, scheduled, published
    
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
