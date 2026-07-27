import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from fastapi_cache.decorator import cache

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, Client, Location, AuditLog
from app.models.clinic import (
    Doctor, Staff, Department, Service, TreatmentRoom,
    BusinessHours, Holiday, InsuranceProvider, PaymentMethod,
    Document, Branding, NotificationSetting, SecuritySetting, IntegrationSetting
)
from app.schemas.clinic import (
    DoctorCreate, DoctorUpdate, DoctorResponse,
    StaffCreate, StaffUpdate, StaffResponse,
    ServiceCreate, ServiceUpdate, ServiceResponse,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    LocationCreate, LocationUpdate, LocationResponse,
    TreatmentRoomCreate, TreatmentRoomUpdate, TreatmentRoomResponse,
    BusinessHoursCreate, BusinessHoursUpdate, BusinessHoursResponse,
    HolidayCreate, HolidayUpdate, HolidayResponse,
    InsuranceProviderCreate, InsuranceProviderUpdate, InsuranceProviderResponse,
    PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodResponse,
    DocumentCreate, DocumentUpdate, DocumentResponse,
    BrandingCreate, BrandingUpdate, BrandingResponse,
    NotificationSettingCreate, NotificationSettingUpdate, NotificationSettingResponse,
    SecuritySettingCreate, SecuritySettingUpdate, SecuritySettingResponse,
    IntegrationSettingCreate, IntegrationSettingUpdate, IntegrationSettingResponse
)

router = APIRouter()

# --- Doctors ---
@router.get("/doctors", response_model=List[DoctorResponse])
@cache(expire=300)
async def read_doctors(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Doctor).where(Doctor.client_id == current_user.client_id))
    return result.scalars().all()

@router.post("/doctors", response_model=DoctorResponse)
async def create_doctor(*, db: AsyncSession = Depends(get_db), doctor_in: DoctorCreate, current_user: User = Depends(get_current_user)) -> Any:
    doctor = Doctor(**doctor_in.model_dump(), client_id=current_user.client_id)
    db.add(doctor)
    await db.commit()
    await db.refresh(doctor)
    return doctor

@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(*, db: AsyncSession = Depends(get_db), doctor_id: uuid.UUID, doctor_in: DoctorUpdate, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id, Doctor.client_id == current_user.client_id))
    doctor = result.scalars().first()
    if not doctor: raise HTTPException(status_code=404, detail="Doctor not found")
    for field, value in doctor_in.model_dump(exclude_unset=True).items(): setattr(doctor, field, value)
    await db.commit()
    await db.refresh(doctor)
    return doctor

@router.delete("/doctors/{doctor_id}")
async def delete_doctor(*, db: AsyncSession = Depends(get_db), doctor_id: uuid.UUID, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id, Doctor.client_id == current_user.client_id))
    doctor = result.scalars().first()
    if not doctor: raise HTTPException(status_code=404, detail="Doctor not found")
    await db.delete(doctor)
    await db.commit()
    return {"ok": True}


# --- Staff ---
@router.get("/staff", response_model=List[StaffResponse])
@cache(expire=300)
async def read_staff(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Staff).where(Staff.client_id == current_user.client_id))
    return result.scalars().all()

@router.post("/staff", response_model=StaffResponse)
async def create_staff(*, db: AsyncSession = Depends(get_db), staff_in: StaffCreate, current_user: User = Depends(get_current_user)) -> Any:
    staff = Staff(**staff_in.model_dump(), client_id=current_user.client_id)
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return staff

@router.put("/staff/{staff_id}", response_model=StaffResponse)
async def update_staff(*, db: AsyncSession = Depends(get_db), staff_id: uuid.UUID, staff_in: StaffUpdate, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Staff).where(Staff.id == staff_id, Staff.client_id == current_user.client_id))
    staff = result.scalars().first()
    if not staff: raise HTTPException(status_code=404, detail="Staff not found")
    for field, value in staff_in.model_dump(exclude_unset=True).items(): setattr(staff, field, value)
    await db.commit()
    await db.refresh(staff)
    return staff

@router.delete("/staff/{staff_id}")
async def delete_staff(*, db: AsyncSession = Depends(get_db), staff_id: uuid.UUID, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Staff).where(Staff.id == staff_id, Staff.client_id == current_user.client_id))
    staff = result.scalars().first()
    if not staff: raise HTTPException(status_code=404, detail="Staff not found")
    await db.delete(staff)
    await db.commit()
    return {"ok": True}


# --- Services ---
@router.get("/services", response_model=List[ServiceResponse])
@cache(expire=300)
async def read_services(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Service).where(Service.client_id == current_user.client_id))
    return result.scalars().all()

@router.post("/services", response_model=ServiceResponse)
async def create_service(*, db: AsyncSession = Depends(get_db), service_in: ServiceCreate, current_user: User = Depends(get_current_user)) -> Any:
    service = Service(**service_in.model_dump(), client_id=current_user.client_id)
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service

@router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service(*, db: AsyncSession = Depends(get_db), service_id: uuid.UUID, service_in: ServiceUpdate, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Service).where(Service.id == service_id, Service.client_id == current_user.client_id))
    service = result.scalars().first()
    if not service: raise HTTPException(status_code=404, detail="Service not found")
    for field, value in service_in.model_dump(exclude_unset=True).items(): setattr(service, field, value)
    await db.commit()
    await db.refresh(service)
    return service

@router.delete("/services/{service_id}")
async def delete_service(*, db: AsyncSession = Depends(get_db), service_id: uuid.UUID, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Service).where(Service.id == service_id, Service.client_id == current_user.client_id))
    service = result.scalars().first()
    if not service: raise HTTPException(status_code=404, detail="Service not found")
    await db.delete(service)
    await db.commit()
    return {"ok": True}


# --- Payment Methods ---
@router.get("/payments", response_model=List[PaymentMethodResponse])
@cache(expire=300)
async def read_payments(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(PaymentMethod).where(PaymentMethod.client_id == current_user.client_id))
    return result.scalars().all()

@router.post("/payments", response_model=PaymentMethodResponse)
async def create_payment(*, db: AsyncSession = Depends(get_db), payment_in: PaymentMethodCreate, current_user: User = Depends(get_current_user)) -> Any:
    payment = PaymentMethod(**payment_in.model_dump(), client_id=current_user.client_id)
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment

@router.put("/payments/{payment_id}", response_model=PaymentMethodResponse)
async def update_payment(*, db: AsyncSession = Depends(get_db), payment_id: uuid.UUID, payment_in: PaymentMethodUpdate, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(PaymentMethod).where(PaymentMethod.id == payment_id, PaymentMethod.client_id == current_user.client_id))
    payment = result.scalars().first()
    if not payment: raise HTTPException(status_code=404, detail="Payment Method not found")
    for field, value in payment_in.model_dump(exclude_unset=True).items(): setattr(payment, field, value)
    await db.commit()
    await db.refresh(payment)
    return payment

@router.delete("/payments/{payment_id}")
async def delete_payment(*, db: AsyncSession = Depends(get_db), payment_id: uuid.UUID, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(PaymentMethod).where(PaymentMethod.id == payment_id, PaymentMethod.client_id == current_user.client_id))
    payment = result.scalars().first()
    if not payment: raise HTTPException(status_code=404, detail="Payment Method not found")
    await db.delete(payment)
    await db.commit()
    return {"ok": True}


# --- Insurance Providers ---
@router.get("/insurance", response_model=List[InsuranceProviderResponse])
@cache(expire=300)
async def read_insurance(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(InsuranceProvider).where(InsuranceProvider.client_id == current_user.client_id))
    return result.scalars().all()

@router.post("/insurance", response_model=InsuranceProviderResponse)
async def create_insurance(*, db: AsyncSession = Depends(get_db), insurance_in: InsuranceProviderCreate, current_user: User = Depends(get_current_user)) -> Any:
    insurance = InsuranceProvider(**insurance_in.model_dump(), client_id=current_user.client_id)
    db.add(insurance)
    await db.commit()
    await db.refresh(insurance)
    return insurance

@router.put("/insurance/{insurance_id}", response_model=InsuranceProviderResponse)
async def update_insurance(*, db: AsyncSession = Depends(get_db), insurance_id: uuid.UUID, insurance_in: InsuranceProviderUpdate, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(InsuranceProvider).where(InsuranceProvider.id == insurance_id, InsuranceProvider.client_id == current_user.client_id))
    insurance = result.scalars().first()
    if not insurance: raise HTTPException(status_code=404, detail="Insurance Provider not found")
    for field, value in insurance_in.model_dump(exclude_unset=True).items(): setattr(insurance, field, value)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="update_insurance",
        details={"insurance_id": str(insurance_id)}
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(insurance)
    return insurance

@router.delete("/insurance/{insurance_id}")
async def delete_insurance(*, db: AsyncSession = Depends(get_db), insurance_id: uuid.UUID, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(InsuranceProvider).where(InsuranceProvider.id == insurance_id, InsuranceProvider.client_id == current_user.client_id))
    insurance = result.scalars().first()
    if not insurance: raise HTTPException(status_code=404, detail="Insurance Provider not found")
    await db.delete(insurance)
    await db.commit()
    return {"ok": True}


# --- Documents ---
@router.get("/documents", response_model=List[DocumentResponse])
async def read_documents(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Document).where(Document.client_id == current_user.client_id))
    return result.scalars().all()

@router.post("/documents", response_model=DocumentResponse)
async def create_document(*, db: AsyncSession = Depends(get_db), document_in: DocumentCreate, current_user: User = Depends(get_current_user)) -> Any:
    doc = Document(**document_in.model_dump(), client_id=current_user.client_id)
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

@router.delete("/documents/{document_id}")
async def delete_document(*, db: AsyncSession = Depends(get_db), document_id: uuid.UUID, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Document).where(Document.id == document_id, Document.client_id == current_user.client_id))
    doc = result.scalars().first()
    if not doc: raise HTTPException(status_code=404, detail="Document not found")
    await db.delete(doc)
    await db.commit()
    return {"ok": True}


# --- Branding ---
@router.get("/branding", response_model=List[BrandingResponse])
async def read_branding(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Branding).where(Branding.client_id == current_user.client_id))
    return result.scalars().all()

@router.post("/branding", response_model=BrandingResponse)
async def create_branding(*, db: AsyncSession = Depends(get_db), branding_in: BrandingCreate, current_user: User = Depends(get_current_user)) -> Any:
    branding = Branding(**branding_in.model_dump(), client_id=current_user.client_id)
    db.add(branding)
    await db.commit()
    await db.refresh(branding)
    return branding

@router.put("/branding/{branding_id}", response_model=BrandingResponse)
async def update_branding(*, db: AsyncSession = Depends(get_db), branding_id: uuid.UUID, branding_in: BrandingUpdate, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(Branding).where(Branding.id == branding_id, Branding.client_id == current_user.client_id))
    branding = result.scalars().first()
    if not branding: raise HTTPException(status_code=404, detail="Branding not found")
    for field, value in branding_in.model_dump(exclude_unset=True).items(): setattr(branding, field, value)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="update_branding",
        details={"branding_id": str(branding_id)}
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(branding)
    return branding


# --- Security Settings ---
@router.get("/security", response_model=List[SecuritySettingResponse])
async def read_security(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(SecuritySetting).where(SecuritySetting.client_id == current_user.client_id))
    return result.scalars().all()

@router.post("/security", response_model=SecuritySettingResponse)
async def create_security(*, db: AsyncSession = Depends(get_db), security_in: SecuritySettingCreate, current_user: User = Depends(get_current_user)) -> Any:
    security = SecuritySetting(**security_in.model_dump(), client_id=current_user.client_id)
    db.add(security)
    await db.commit()
    await db.refresh(security)
    return security

@router.put("/security/{security_id}", response_model=SecuritySettingResponse)
async def update_security(*, db: AsyncSession = Depends(get_db), security_id: uuid.UUID, security_in: SecuritySettingUpdate, current_user: User = Depends(get_current_user)) -> Any:
    result = await db.execute(select(SecuritySetting).where(SecuritySetting.id == security_id, SecuritySetting.client_id == current_user.client_id))
    security = result.scalars().first()
    if not security: raise HTTPException(status_code=404, detail="Security Settings not found")
    for field, value in security_in.model_dump(exclude_unset=True).items(): setattr(security, field, value)
    await db.commit()
    await db.refresh(security)
    return security
