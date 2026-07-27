import uuid
from typing import Optional, List
import enum
from sqlalchemy import String, ForeignKey, Boolean, JSON, Enum, Integer, Float, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, datetime

from app.models.base import Base

class PeriodType(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class AnalyticsSnapshot(Base):
    __tablename__ = "analytics_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    period_type: Mapped[PeriodType] = mapped_column(Enum(PeriodType), nullable=False)
    period_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    
    metrics: Mapped[dict] = mapped_column(JSON, nullable=False)
    # Expected metrics:
    # total_revenue, new_patients, returning_patients
    # appointments_completed, appointments_cancelled, appointments_no_show
    # ai_conversations, ai_bookings, sms_sent, emails_sent
    # recovered_revenue


class KPIMetric(Base):
    __tablename__ = "kpi_metrics"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    target: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    timestamp: Mapped[str] = mapped_column(String(50), default=lambda: datetime.utcnow().isoformat())
    dimensions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # e.g. {"location_id": "...", "doctor_id": "..."}


class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    target_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    predicted_value: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False) # 0.0 to 1.0
    
    generated_at: Mapped[str] = mapped_column(String(50), default=lambda: datetime.utcnow().isoformat())


class DashboardWidget(Base):
    __tablename__ = "dashboard_widgets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    widget_type: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "revenue_chart", "kpi_grid"
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    # Layout info for grid systems
    position_x: Mapped[int] = mapped_column(Integer, default=0)
    position_y: Mapped[int] = mapped_column(Integer, default=0)
    width: Mapped[int] = mapped_column(Integer, default=1)
    height: Mapped[int] = mapped_column(Integer, default=1)


class SavedReport(Base):
    __tablename__ = "saved_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    config: Mapped[dict] = mapped_column(JSON, nullable=False) # Date ranges, selected dimensions, metrics
    is_scheduled: Mapped[bool] = mapped_column(Boolean, default=False)
    schedule_cron: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class StaffScore(Base):
    __tablename__ = "staff_scores"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    staff_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("staff.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    period_type: Mapped[PeriodType] = mapped_column(Enum(PeriodType), nullable=False)
    period_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    metrics: Mapped[dict] = mapped_column(JSON, nullable=False)
    productivity_score: Mapped[float] = mapped_column(Float, default=0.0)
