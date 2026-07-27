import uuid
from typing import Optional, List
import enum
from sqlalchemy import String, ForeignKey, Boolean, JSON, Enum, Integer, Float, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, datetime

from app.models.base import Base


class PatientRiskScore(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pms_patient_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Revenue & Clinical Tracking
    last_visit_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_recall_due: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    insurance_provider: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    insurance_expiration: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # AI Predictive Scores
    churn_risk_score: Mapped[PatientRiskScore] = mapped_column(
        Enum(PatientRiskScore), default=PatientRiskScore.LOW, nullable=False
    )
    no_show_probability: Mapped[float] = mapped_column(Float, default=0.0, nullable=False) # 0.0 to 1.0
    total_revenue_generated: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    created_at_dt: Mapped[datetime] = mapped_column(String(50), default=lambda: datetime.utcnow().isoformat())


class RecallRule(Base):
    __tablename__ = "recall_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    name: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "6 Month Prophy"
    interval_months: Mapped[int] = mapped_column(Integer, nullable=False)
    treatment_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Automation trigger
    auto_create_task: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    auto_send_message: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    message_template_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class TreatmentOpportunityStatus(str, enum.Enum):
    OPEN = "open"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    DECLINED = "declined"


class TreatmentOpportunityPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TreatmentOpportunity(Base):
    __tablename__ = "treatment_opportunities"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pms_treatment_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    description: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_value: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    status: Mapped[TreatmentOpportunityStatus] = mapped_column(
        Enum(TreatmentOpportunityStatus), default=TreatmentOpportunityStatus.OPEN, nullable=False
    )
    priority: Mapped[TreatmentOpportunityPriority] = mapped_column(
        Enum(TreatmentOpportunityPriority), default=TreatmentOpportunityPriority.MEDIUM, nullable=False
    )
    
    date_identified: Mapped[date] = mapped_column(Date, default=date.today)
    recommended_followup_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)


class RevenueTaskType(str, enum.Enum):
    RECALL = "recall"
    FOLLOWUP = "followup"
    INSURANCE = "insurance"
    NO_SHOW = "no_show"
    UNFINISHED_TREATMENT = "unfinished_treatment"


class RevenueTaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DISMISSED = "dismissed"


class RevenueTask(Base):
    __tablename__ = "revenue_tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=True, index=True
    )
    
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    task_type: Mapped[RevenueTaskType] = mapped_column(
        Enum(RevenueTaskType), nullable=False
    )
    status: Mapped[RevenueTaskStatus] = mapped_column(
        Enum(RevenueTaskStatus), default=RevenueTaskStatus.PENDING, nullable=False
    )
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False) # high, medium, low
    
    assigned_role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # e.g. Receptionist, Billing
    assigned_user_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    estimated_revenue: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class AutomationEventTrigger(str, enum.Enum):
    NO_SHOW = "no_show"
    CANCELLATION = "cancellation"
    RECALL_DUE = "recall_due"
    INSURANCE_EXPIRING = "insurance_expiring"
    TREATMENT_PENDING = "treatment_pending"
    BIRTHDAY = "birthday"


class AutomationAction(str, enum.Enum):
    SEND_SMS = "send_sms"
    SEND_EMAIL = "send_email"
    CREATE_TASK = "create_task"
    AI_VOICE_CALL = "ai_voice_call"


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    event_trigger: Mapped[AutomationEventTrigger] = mapped_column(Enum(AutomationEventTrigger), nullable=False)
    action: Mapped[AutomationAction] = mapped_column(Enum(AutomationAction), nullable=False)
    
    delay_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    message_template_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # Any extra JSON config (e.g. conditions like priority > high)


class AutomationLog(Base):
    __tablename__ = "automation_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    automation_rule_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("automation_rules.id", ondelete="SET NULL"), nullable=True
    )
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("patient_profiles.id", ondelete="SET NULL"), nullable=True
    )
    
    action_taken: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False) # success, failed
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[str] = mapped_column(String(50), default=lambda: datetime.utcnow().isoformat())
