import uuid
from typing import List, Optional
from sqlalchemy import String, ForeignKey, Boolean, JSON, Enum, Integer, Float, Text, Date, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from datetime import date

from app.models.base import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    
    photo: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    specialization: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    license_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    experience_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    biography: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    languages: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    working_hours: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    services_offered: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    appointment_duration_override: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    color_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)

    client: Mapped["Client"] = relationship("Client")
    location: Mapped["Location"] = relationship("Location")
    user: Mapped["User"] = relationship("User")


class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    
    photo: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. Receptionist, Manager
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    permissions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    working_hours: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)

    client: Mapped["Client"] = relationship("Client")
    location: Mapped["Location"] = relationship("Location")
    user: Mapped["User"] = relationship("User")


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    client: Mapped["Client"] = relationship("Client")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    estimated_price_range: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    color_label: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    preparation_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recovery_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    online_booking_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    client: Mapped["Client"] = relationship("Client")
    department: Mapped["Department"] = relationship("Department")


class TreatmentRoom(Base):
    __tablename__ = "treatment_rooms"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("locations.id", ondelete="CASCADE"), nullable=True)
    assigned_doctor_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    
    room_name: Mapped[str] = mapped_column(String(100), nullable=False)
    room_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    equipment: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    availability: Mapped[str] = mapped_column(String(50), default="available", nullable=False)
    maintenance_status: Mapped[str] = mapped_column(String(50), default="ok", nullable=False)

    client: Mapped["Client"] = relationship("Client")
    location: Mapped["Location"] = relationship("Location")
    assigned_doctor: Mapped["Doctor"] = relationship("Doctor")


class BusinessHours(Base):
    __tablename__ = "business_hours"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("locations.id", ondelete="CASCADE"), nullable=True)
    
    # Simple JSON representation for weekly schedule: { "monday": { "open": "09:00", "close": "17:00" }, ... }
    weekly_schedule: Mapped[dict] = mapped_column(JSON, nullable=False)
    lunch_break: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    emergency_hours: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    holiday_overrides: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    client: Mapped["Client"] = relationship("Client")
    location: Mapped["Location"] = relationship("Location")


class Holiday(Base):
    __tablename__ = "holidays"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("locations.id", ondelete="CASCADE"), nullable=True)
    
    date: Mapped[date] = mapped_column(Date, nullable=False)
    holiday_type: Mapped[str] = mapped_column(String(50), nullable=False) # public, clinic, doctor_leave, maintenance, custom
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    doctor_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=True)

    client: Mapped["Client"] = relationship("Client")
    location: Mapped["Location"] = relationship("Location")
    doctor: Mapped["Doctor"] = relationship("Doctor")


class InsuranceProvider(Base):
    __tablename__ = "insurance_providers"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    provider_name: Mapped[str] = mapped_column(String(200), nullable=False)
    provider_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_accepted: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    verification_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_verification_ready: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    client: Mapped["Client"] = relationship("Client")


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    method_type: Mapped[str] = mapped_column(String(50), nullable=False) # Cash, Credit Card, Financing, etc
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    client: Mapped["Client"] = relationship("Client")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    client: Mapped["Client"] = relationship("Client")


class Branding(Base):
    __tablename__ = "branding"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    favicon_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    primary_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    secondary_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    accent_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    typography: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    email_signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sms_signature: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)

    client: Mapped["Client"] = relationship("Client")


class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sms_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    push_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    appointment_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    emergency_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    marketing_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    custom_rules: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    client: Mapped["Client"] = relationship("Client")


class SecuritySetting(Base):
    __tablename__ = "security_settings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    session_timeout_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    password_policy: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    allowed_ips: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    trusted_devices: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    audit_logging_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    client: Mapped["Client"] = relationship("Client")


class IntegrationSetting(Base):
    __tablename__ = "integration_settings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    provider_name: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., Twilio, OpenAI, Stripe, Dentrix
    api_keys: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="disconnected", nullable=False)
    sync_frequency: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    client: Mapped["Client"] = relationship("Client")
