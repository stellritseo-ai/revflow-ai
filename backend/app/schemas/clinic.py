from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import date

# --- Client Updates ---
class ClientUpdate(BaseModel):
    clinic_name: Optional[str] = None
    legal_business_name: Optional[str] = None
    registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    business_email: Optional[str] = None
    phone: Optional[str] = None
    emergency_phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    languages: Optional[Dict[str, Any]] = None
    description: Optional[str] = None

# --- Location Updates ---
class LocationBase(BaseModel):
    location_name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    google_maps_link: Optional[str] = None
    manager_id: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    active: bool = True

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    location_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    google_maps_link: Optional[str] = None
    manager_id: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    active: Optional[bool] = None

class LocationResponse(LocationBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Doctor ---
class DoctorBase(BaseModel):
    photo: Optional[str] = None
    full_name: str
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    experience_years: Optional[int] = None
    biography: Optional[str] = None
    languages: Optional[Dict[str, Any]] = None
    working_hours: Optional[Dict[str, Any]] = None
    services_offered: Optional[Dict[str, Any]] = None
    appointment_duration_override: Optional[int] = None
    color_code: Optional[str] = None
    status: str = "active"
    user_id: Optional[str] = None
    location_id: Optional[uuid.UUID] = None

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    photo: Optional[str] = None
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    experience_years: Optional[int] = None
    biography: Optional[str] = None
    languages: Optional[Dict[str, Any]] = None
    working_hours: Optional[Dict[str, Any]] = None
    services_offered: Optional[Dict[str, Any]] = None
    appointment_duration_override: Optional[int] = None
    color_code: Optional[str] = None
    status: Optional[str] = None
    user_id: Optional[str] = None
    location_id: Optional[uuid.UUID] = None

class DoctorResponse(DoctorBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Staff ---
class StaffBase(BaseModel):
    photo: Optional[str] = None
    full_name: str
    role: str
    department: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None
    working_hours: Optional[Dict[str, Any]] = None
    status: str = "active"
    user_id: Optional[str] = None
    location_id: Optional[uuid.UUID] = None

class StaffCreate(StaffBase):
    pass

class StaffUpdate(BaseModel):
    photo: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None
    working_hours: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    user_id: Optional[str] = None
    location_id: Optional[uuid.UUID] = None

class StaffResponse(StaffBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Department ---
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_custom: bool = False

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_custom: Optional[bool] = None

class DepartmentResponse(DepartmentBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Service ---
class ServiceBase(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: int = 60
    estimated_price_range: Optional[str] = None
    color_label: Optional[str] = None
    preparation_instructions: Optional[str] = None
    recovery_instructions: Optional[str] = None
    online_booking_enabled: bool = True
    is_active: bool = True
    department_id: Optional[uuid.UUID] = None

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    estimated_price_range: Optional[str] = None
    color_label: Optional[str] = None
    preparation_instructions: Optional[str] = None
    recovery_instructions: Optional[str] = None
    online_booking_enabled: Optional[bool] = None
    is_active: Optional[bool] = None
    department_id: Optional[uuid.UUID] = None

class ServiceResponse(ServiceBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- TreatmentRoom ---
class TreatmentRoomBase(BaseModel):
    room_name: str
    room_number: Optional[str] = None
    equipment: Optional[Dict[str, Any]] = None
    availability: str = "available"
    maintenance_status: str = "ok"
    location_id: Optional[uuid.UUID] = None
    assigned_doctor_id: Optional[uuid.UUID] = None

class TreatmentRoomCreate(TreatmentRoomBase):
    pass

class TreatmentRoomUpdate(BaseModel):
    room_name: Optional[str] = None
    room_number: Optional[str] = None
    equipment: Optional[Dict[str, Any]] = None
    availability: Optional[str] = None
    maintenance_status: Optional[str] = None
    location_id: Optional[uuid.UUID] = None
    assigned_doctor_id: Optional[uuid.UUID] = None

class TreatmentRoomResponse(TreatmentRoomBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- BusinessHours ---
class BusinessHoursBase(BaseModel):
    weekly_schedule: Dict[str, Any]
    lunch_break: Optional[Dict[str, Any]] = None
    emergency_hours: Optional[Dict[str, Any]] = None
    holiday_overrides: Optional[Dict[str, Any]] = None
    location_id: Optional[uuid.UUID] = None

class BusinessHoursCreate(BusinessHoursBase):
    pass

class BusinessHoursUpdate(BaseModel):
    weekly_schedule: Optional[Dict[str, Any]] = None
    lunch_break: Optional[Dict[str, Any]] = None
    emergency_hours: Optional[Dict[str, Any]] = None
    holiday_overrides: Optional[Dict[str, Any]] = None
    location_id: Optional[uuid.UUID] = None

class BusinessHoursResponse(BusinessHoursBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Holiday ---
class HolidayBase(BaseModel):
    date: date
    holiday_type: str
    description: Optional[str] = None
    location_id: Optional[uuid.UUID] = None
    doctor_id: Optional[uuid.UUID] = None

class HolidayCreate(HolidayBase):
    pass

class HolidayUpdate(BaseModel):
    date: Optional[date] = None
    holiday_type: Optional[str] = None
    description: Optional[str] = None
    location_id: Optional[uuid.UUID] = None
    doctor_id: Optional[uuid.UUID] = None

class HolidayResponse(HolidayBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- InsuranceProvider ---
class InsuranceProviderBase(BaseModel):
    provider_name: str
    provider_code: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    is_accepted: bool = True
    verification_notes: Optional[str] = None
    ai_verification_ready: bool = False

class InsuranceProviderCreate(InsuranceProviderBase):
    pass

class InsuranceProviderUpdate(BaseModel):
    provider_name: Optional[str] = None
    provider_code: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    is_accepted: Optional[bool] = None
    verification_notes: Optional[str] = None
    ai_verification_ready: Optional[bool] = None

class InsuranceProviderResponse(InsuranceProviderBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- PaymentMethod ---
class PaymentMethodBase(BaseModel):
    method_type: str
    details: Optional[Dict[str, Any]] = None
    is_active: bool = True

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethodUpdate(BaseModel):
    method_type: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class PaymentMethodResponse(PaymentMethodBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Document ---
class DocumentBase(BaseModel):
    file_name: str
    file_type: str
    category: str
    url: str
    size_bytes: Optional[int] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    file_name: Optional[str] = None
    category: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Branding ---
class BrandingBase(BaseModel):
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    typography: Optional[Dict[str, Any]] = None
    email_signature: Optional[str] = None
    sms_signature: Optional[str] = None

class BrandingCreate(BrandingBase):
    pass

class BrandingUpdate(BaseModel):
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    typography: Optional[Dict[str, Any]] = None
    email_signature: Optional[str] = None
    sms_signature: Optional[str] = None

class BrandingResponse(BrandingBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- NotificationSetting ---
class NotificationSettingBase(BaseModel):
    email_notifications: bool = True
    sms_notifications: bool = True
    push_notifications: bool = True
    appointment_alerts: bool = True
    emergency_alerts: bool = True
    marketing_notifications: bool = True
    custom_rules: Optional[Dict[str, Any]] = None

class NotificationSettingCreate(NotificationSettingBase):
    pass

class NotificationSettingUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    appointment_alerts: Optional[bool] = None
    emergency_alerts: Optional[bool] = None
    marketing_notifications: Optional[bool] = None
    custom_rules: Optional[Dict[str, Any]] = None

class NotificationSettingResponse(NotificationSettingBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- SecuritySetting ---
class SecuritySettingBase(BaseModel):
    session_timeout_minutes: int = 60
    password_policy: Optional[Dict[str, Any]] = None
    allowed_ips: Optional[Dict[str, Any]] = None
    trusted_devices: Optional[Dict[str, Any]] = None
    audit_logging_enabled: bool = True

class SecuritySettingCreate(SecuritySettingBase):
    pass

class SecuritySettingUpdate(BaseModel):
    session_timeout_minutes: Optional[int] = None
    password_policy: Optional[Dict[str, Any]] = None
    allowed_ips: Optional[Dict[str, Any]] = None
    trusted_devices: Optional[Dict[str, Any]] = None
    audit_logging_enabled: Optional[bool] = None

class SecuritySettingResponse(SecuritySettingBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- IntegrationSetting ---
class IntegrationSettingBase(BaseModel):
    provider_name: str
    api_keys: Optional[Dict[str, Any]] = None
    status: str = "disconnected"
    sync_frequency: Optional[str] = None

class IntegrationSettingCreate(IntegrationSettingBase):
    pass

class IntegrationSettingUpdate(BaseModel):
    api_keys: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    sync_frequency: Optional[str] = None

class IntegrationSettingResponse(IntegrationSettingBase):
    id: uuid.UUID
    client_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)
