import uuid
import enum
from typing import Optional
from sqlalchemy import String, ForeignKey, Boolean, JSON, Enum, Integer, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class RuleType(str, enum.Enum):
    WEEKLY_HOURS = "weekly_hours"
    HOLIDAY = "holiday"
    BLOCK = "block"
    OVERRIDE = "override"


class WaitlistStatus(str, enum.Enum):
    ACTIVE = "active"
    NOTIFIED = "notified"
    BOOKED = "booked"
    CANCELLED = "cancelled"


class AppointmentType(Base):
    __tablename__ = "appointment_types"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    color: Mapped[str] = mapped_column(String(20), default="#3b82f6", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Operatory(Base):
    __tablename__ = "operatories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="chair", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class AvailabilityRule(Base):
    __tablename__ = "availability_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_type: Mapped[RuleType] = mapped_column(Enum(RuleType), nullable=False)
    day_of_week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # 0=Mon, 6=Sun
    start_time: Mapped[str] = mapped_column(String(20), nullable=False) # HH:MM
    end_time: Mapped[str] = mapped_column(String(20), nullable=False) # HH:MM
    specific_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True) # YYYY-MM-DD
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class DoctorSchedule(Base):
    __tablename__ = "doctor_schedule"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_name: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[str] = mapped_column(String(20), nullable=False) # YYYY-MM-DD
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    shift_start: Mapped[Optional[str]] = mapped_column(String(20), nullable=True) # HH:MM
    shift_end: Mapped[Optional[str]] = mapped_column(String(20), nullable=True) # HH:MM
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Waitlist(Base):
    __tablename__ = "waitlist"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_name: Mapped[str] = mapped_column(String(200), nullable=False)
    patient_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    patient_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    treatment_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    preferred_days: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # e.g. [0, 2, 4] for Mon, Wed, Fri
    preferred_time_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # e.g. "morning", "afternoon"
    status: Mapped[WaitlistStatus] = mapped_column(Enum(WaitlistStatus), default=WaitlistStatus.ACTIVE, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class BookingRule(Base):
    __tablename__ = "booking_rules"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_name: Mapped[str] = mapped_column(String(100), nullable=False)
    rule_value: Mapped[str] = mapped_column(String(500), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class TimeBlock(Base):
    __tablename__ = "time_blocks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time: Mapped[str] = mapped_column(String(50), nullable=False) # ISO String
    end_time: Mapped[str] = mapped_column(String(50), nullable=False) # ISO String
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    provider_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    operatory_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("operatories.id", ondelete="CASCADE"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ConflictLog(Base):
    __tablename__ = "conflict_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    conflict_type: Mapped[str] = mapped_column(String(100), nullable=False) # double_booking, out_of_hours, blocked_time
    description: Mapped[str] = mapped_column(Text, nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
