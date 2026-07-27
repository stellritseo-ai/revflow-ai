import uuid
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, ForeignKey, Boolean, JSON, Enum, Integer, Float, Text, DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base

class PlanType(str, enum.Enum):
    FREE_TRIAL = "free_trial"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    UNLIMITED = "unlimited"
    CUSTOM = "custom"

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    plan_type: Mapped[PlanType] = mapped_column(Enum(PlanType), nullable=False)
    
    monthly_price: Mapped[float] = mapped_column(Float, default=0.0)
    yearly_price: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Limits
    max_users: Mapped[int] = mapped_column(Integer, default=1)
    max_doctors: Mapped[int] = mapped_column(Integer, default=1)
    max_ai_requests: Mapped[int] = mapped_column(Integer, default=100)
    max_voice_minutes: Mapped[int] = mapped_column(Integer, default=0)
    max_sms: Mapped[int] = mapped_column(Integer, default=0)
    max_emails: Mapped[int] = mapped_column(Integer, default=1000)
    max_storage_mb: Mapped[int] = mapped_column(Integer, default=1024)
    max_knowledge_docs: Mapped[int] = mapped_column(Integer, default=10)
    
    # Features
    api_access: Mapped[bool] = mapped_column(Boolean, default=False)
    white_label: Mapped[bool] = mapped_column(Boolean, default=False)
    allowed_integrations: Mapped[List[str]] = mapped_column(JSON, default=list)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False)
    
    status: Mapped[str] = mapped_column(String(50), default="active") # active, past_due, canceled, trialing
    billing_cycle: Mapped[str] = mapped_column(String(20), default="monthly") # monthly, yearly
    
    current_period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)


class BillingAccount(Base):
    __tablename__ = "billing_accounts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    balance_cents: Mapped[int] = mapped_column(Integer, default=0)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    tax_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class UsageMetric(Base):
    __tablename__ = "usage_metrics"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    period_month: Mapped[str] = mapped_column(String(7), nullable=False) # e.g. "2026-07"
    
    ai_requests: Mapped[int] = mapped_column(Integer, default=0)
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    voice_minutes: Mapped[int] = mapped_column(Integer, default=0)
    sms_sent: Mapped[int] = mapped_column(Integer, default=0)
    emails_sent: Mapped[int] = mapped_column(Integer, default=0)
    storage_used_mb: Mapped[int] = mapped_column(Integer, default=0)
    knowledge_docs: Mapped[int] = mapped_column(Integer, default=0)


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=True, index=True)
    plan_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("subscription_plans.id", ondelete="CASCADE"), nullable=True, index=True)
    
    feature_key: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "voice_ai", "marketing_automation"
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False)


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Assuming user uuid is supported
    
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="open") # open, in_progress, closed, escalated
    priority: Mapped[str] = mapped_column(String(50), default="normal") # low, normal, high, urgent
    
    assigned_to: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # Admin user ID or email


class SupportMessage(Base):
    __tablename__ = "support_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False)
    
    sender_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # Can be client user or admin
    is_internal: Mapped[bool] = mapped_column(Boolean, default=False)
    content: Mapped[Text] = mapped_column(Text, nullable=False)


class SystemHealth(Base):
    __tablename__ = "system_health_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    
    cpu_usage: Mapped[float] = mapped_column(Float, default=0.0)
    ram_usage: Mapped[float] = mapped_column(Float, default=0.0)
    active_connections: Mapped[int] = mapped_column(Integer, default=0)
    api_latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    error_rate: Mapped[float] = mapped_column(Float, default=0.0)
    
    service_status: Mapped[dict] = mapped_column(JSON, default=dict) # e.g. {"database": "healthy", "redis": "healthy"}


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[Text] = mapped_column(Text, nullable=False)
    
    target_plan_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("subscription_plans.id", ondelete="CASCADE"), nullable=True)
    target_client_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
