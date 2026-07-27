from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from sqlalchemy import select

from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant
from app.models.models import Appointment, AppointmentStatus, Client
from app.scheduling.services.booking_engine import book_appointment_with_engine
from app.scheduling.services.availability_engine import compute_availability
from app.scheduling.services.waitlist_manager import find_waitlist_matches
from app.services.pms_adapters import get_pms_adapter
from app.core.websocket import manager

router = APIRouter()


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class SlotResponse(BaseModel):
    slot_id: str
    start_time: str
    end_time: str
    provider_name: str


class BookAppointmentRequest(BaseModel):
    slot_id: str
    patient_name: str
    patient_phone: str
    patient_email: Optional[str] = None
    treatment_type: str
    provider_name: str
    scheduled_at: str
    duration_minutes: int = 60
    notes: Optional[str] = None
    revenue_amount: Optional[float] = None
    call_id: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: str
    client_id: str
    call_id: Optional[str]
    patient_name: str
    patient_phone: str
    patient_email: Optional[str]
    status: str
    scheduled_at: str
    duration_minutes: int
    treatment_type: Optional[str]
    provider_name: Optional[str]
    pms_appointment_id: Optional[str]
    notes: Optional[str]
    revenue_amount: Optional[float]


class UpdateAppointmentStatusRequest(BaseModel):
    status: AppointmentStatus


class WaitlistMatchResponse(BaseModel):
    id: str
    patient_name: str
    patient_phone: str
    treatment_type: Optional[str]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/slots", response_model=List[SlotResponse])
async def get_available_slots(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    duration_minutes: int = 60,
    provider_name: Optional[str] = None,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Advanced Availability Engine:
    Combines PMS available slots with internal blocking rules and operatory constraints.
    """
    slots = await compute_availability(
        client_id=str(ctx.client_id),
        db=db,
        date_from=date_from,
        date_to=date_to,
        duration_minutes=duration_minutes,
        provider_name=provider_name
    )
    return slots


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def book_appointment(
    payload: BookAppointmentRequest,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Books an appointment using the Advanced Scheduling Engine.
    Detects double-booking conflicts and logs them.
    """
    try:
        appt = await book_appointment_with_engine(
            client_id=str(ctx.client_id),
            db=db,
            slot_id=payload.slot_id,
            patient_name=payload.patient_name,
            patient_phone=payload.patient_phone,
            patient_email=payload.patient_email,
            treatment_type=payload.treatment_type,
            provider_name=payload.provider_name,
            scheduled_at=payload.scheduled_at,
            duration_minutes=payload.duration_minutes,
            notes=payload.notes,
            revenue_amount=payload.revenue_amount,
            call_id=payload.call_id,
        )
        # Notify clients about new booking via WebSocket
        await manager.broadcast_to_client(str(ctx.client_id), {
            "type": "appointment_booked",
            "appointment_id": str(appt.id)
        })
        
        # Serialize response
        return AppointmentResponse(
            id=str(appt.id),
            client_id=str(appt.client_id),
            call_id=str(appt.call_id) if appt.call_id else None,
            patient_name=appt.patient_name,
            patient_phone=appt.patient_phone,
            patient_email=appt.patient_email,
            status=appt.status.value,
            scheduled_at=appt.scheduled_at,
            duration_minutes=appt.duration_minutes,
            treatment_type=appt.treatment_type,
            provider_name=appt.provider_name,
            pms_appointment_id=appt.pms_appointment_id,
            notes=appt.notes,
            revenue_amount=appt.revenue_amount
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[AppointmentResponse])
async def list_appointments(
    status: Optional[str] = None,
    provider: Optional[str] = None,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List all appointments for the clinic calendar."""
    stmt = select(Appointment)
    if ctx.client_id:
        stmt = stmt.where(Appointment.client_id == ctx.client_id)
    if status:
        stmt = stmt.where(Appointment.status == AppointmentStatus(status))
    if provider:
        stmt = stmt.where(Appointment.provider_name == provider)

    stmt = stmt.order_by(Appointment.scheduled_at.desc())
    
    appts = (await db.execute(stmt)).scalars().all()
    
    return [
        AppointmentResponse(
            id=str(appt.id),
            client_id=str(appt.client_id),
            call_id=str(appt.call_id) if appt.call_id else None,
            patient_name=appt.patient_name,
            patient_phone=appt.patient_phone,
            patient_email=appt.patient_email,
            status=appt.status.value,
            scheduled_at=appt.scheduled_at,
            duration_minutes=appt.duration_minutes,
            treatment_type=appt.treatment_type,
            provider_name=appt.provider_name,
            pms_appointment_id=appt.pms_appointment_id,
            notes=appt.notes,
            revenue_amount=appt.revenue_amount
        )
        for appt in appts
    ]


@router.patch("/{appt_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appt_id: str,
    payload: UpdateAppointmentStatusRequest,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Update appointment status (e.g. reschedule, cancel, complete).
    If cancelled, triggers PMS cancellation and checks Waitlist for matches.
    """
    stmt = select(Appointment).where(
        Appointment.id == uuid.UUID(appt_id),
        Appointment.client_id == ctx.client_id
    )
    appt = (await db.execute(stmt)).scalar_one_or_none()
    
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # If cancelling, also cancel in PMS
    if payload.status == AppointmentStatus.CANCELLED and appt.pms_appointment_id:
        c_stmt = select(Client).where(Client.id == ctx.client_id)
        client = (await db.execute(c_stmt)).scalar_one_or_none()
        pms_type = client.pms_type.value if client else "none"
        adapter = get_pms_adapter(pms_type)
        await adapter.cancel_appointment(appt.pms_appointment_id)

    appt.status = payload.status
    await db.commit()
    await db.refresh(appt)
    
    # Broadcast status change
    await manager.broadcast_to_client(str(ctx.client_id), {
        "type": "appointment_updated",
        "appointment_id": str(appt.id),
        "status": appt.status.value
    })
    
    return AppointmentResponse(
        id=str(appt.id),
        client_id=str(appt.client_id),
        call_id=str(appt.call_id) if appt.call_id else None,
        patient_name=appt.patient_name,
        patient_phone=appt.patient_phone,
        patient_email=appt.patient_email,
        status=appt.status.value,
        scheduled_at=appt.scheduled_at,
        duration_minutes=appt.duration_minutes,
        treatment_type=appt.treatment_type,
        provider_name=appt.provider_name,
        pms_appointment_id=appt.pms_appointment_id,
        notes=appt.notes,
        revenue_amount=appt.revenue_amount
    )


@router.get("/{appt_id}/waitlist-matches", response_model=List[WaitlistMatchResponse])
async def check_waitlist_matches(
    appt_id: str,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    For a cancelled or rescheduled appointment gap, return potential Waitlist matches.
    """
    stmt = select(Appointment).where(
        Appointment.id == uuid.UUID(appt_id),
        Appointment.client_id == ctx.client_id
    )
    appt = (await db.execute(stmt)).scalar_one_or_none()
    
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    matches = await find_waitlist_matches(
        client_id=str(ctx.client_id),
        db=db,
        freed_slot_start=appt.scheduled_at,
        freed_slot_duration=appt.duration_minutes,
        treatment_type=appt.treatment_type
    )
    return matches
