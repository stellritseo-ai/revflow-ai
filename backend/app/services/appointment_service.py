import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.models import Appointment, AppointmentStatus, Client, Call, CallStatus
from app.services.pms_adapters import get_pms_adapter, TimeSlot, TREATMENTS
from app.core.websocket import manager

logger = structlog.get_logger()


async def get_available_slots(
    client_id: str,
    db: AsyncSession,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    duration_minutes: int = 60,
) -> List[dict]:
    """
    Fetch available slots from the clinic's configured PMS adapter.
    Falls back to mock adapter if PMS is not connected.
    """
    # Get client's PMS type
    stmt = select(Client).where(Client.id == uuid.UUID(client_id))
    result = await db.execute(stmt)
    client = result.scalar_one_or_none()

    pms_type = client.pms_type.value if client else "none"
    adapter = get_pms_adapter(pms_type)

    # Default to next 7 days if not specified
    now = datetime.now()
    from_str = date_from or now.isoformat()
    to_str = date_to or (now + timedelta(days=7)).isoformat()

    slots = await adapter.get_available_slots(from_str, to_str, duration_minutes)
    return [s.to_dict() for s in slots]


async def book_appointment(
    client_id: str,
    call_id: Optional[str],
    slot_id: str,
    patient_name: str,
    patient_phone: str,
    patient_email: Optional[str],
    treatment_type: str,
    provider_name: str,
    scheduled_at: str,
    duration_minutes: int,
    notes: Optional[str],
    revenue_amount: Optional[float],
    db: AsyncSession,
) -> Appointment:
    """
    Books an appointment via the PMS adapter and saves it to the database.
    If the call_id is provided, marks the originating call as 'recovered'.
    """
    stmt = select(Client).where(Client.id == uuid.UUID(client_id))
    result = await db.execute(stmt)
    client = result.scalar_one_or_none()
    pms_type = client.pms_type.value if client else "none"

    adapter = get_pms_adapter(pms_type)
    booking = await adapter.book_appointment(
        slot_id=slot_id,
        patient_name=patient_name,
        patient_phone=patient_phone,
        patient_email=patient_email,
        treatment_type=treatment_type,
        notes=notes,
    )

    if not booking.success:
        raise ValueError(booking.message)

    # Save appointment record
    appt = Appointment(
        client_id=uuid.UUID(client_id),
        call_id=uuid.UUID(call_id) if call_id else None,
        patient_name=patient_name,
        patient_phone=patient_phone,
        patient_email=patient_email,
        status=AppointmentStatus.SCHEDULED,
        scheduled_at=scheduled_at,
        duration_minutes=duration_minutes,
        treatment_type=treatment_type,
        provider_name=provider_name,
        pms_appointment_id=booking.pms_appointment_id,
        notes=notes,
        revenue_amount=revenue_amount,
    )
    db.add(appt)

    # If this was booked from a call, mark it recovered
    if call_id:
        call_stmt = select(Call).where(Call.id == uuid.UUID(call_id))
        call_result = await db.execute(call_stmt)
        call = call_result.scalar_one_or_none()
        if call:
            call.status = CallStatus.RECOVERED
            call.revenue_estimate = revenue_amount

    await db.commit()
    await db.refresh(appt)

    # Broadcast the new appointment via WebSocket
    await manager.broadcast_to_tenant(client_id, {
        "event": "appointment_created",
        "appointment": _serialize_appointment(appt),
    })

    logger.info("Appointment booked", appt_id=str(appt.id), pms_id=booking.pms_appointment_id)
    return appt


async def list_appointments(
    client_id: str,
    db: AsyncSession,
    status_filter: Optional[AppointmentStatus] = None,
    limit: int = 50,
) -> List[Appointment]:
    """Returns all appointments for a tenant, newest first."""
    stmt = (
        select(Appointment)
        .where(Appointment.client_id == uuid.UUID(client_id))
        .order_by(desc(Appointment.created_at))
        .limit(limit)
    )
    if status_filter:
        stmt = stmt.where(Appointment.status == status_filter)
    result = await db.execute(stmt)
    return result.scalars().all()


async def update_appointment_status(
    appointment_id: str,
    new_status: AppointmentStatus,
    client_id: str,
    db: AsyncSession,
) -> Appointment:
    stmt = select(Appointment).where(Appointment.id == uuid.UUID(appointment_id))
    result = await db.execute(stmt)
    appt = result.scalar_one_or_none()
    if not appt:
        raise ValueError(f"Appointment {appointment_id} not found")

    appt.status = new_status
    await db.commit()
    await db.refresh(appt)

    await manager.broadcast_to_tenant(client_id, {
        "event": "appointment_updated",
        "appointment": _serialize_appointment(appt),
    })
    return appt


def _serialize_appointment(appt: Appointment) -> dict:
    return {
        "id": str(appt.id),
        "client_id": str(appt.client_id),
        "call_id": str(appt.call_id) if appt.call_id else None,
        "patient_name": appt.patient_name,
        "patient_phone": appt.patient_phone,
        "patient_email": appt.patient_email,
        "status": appt.status.value,
        "scheduled_at": appt.scheduled_at,
        "duration_minutes": appt.duration_minutes,
        "treatment_type": appt.treatment_type,
        "provider_name": appt.provider_name,
        "pms_appointment_id": appt.pms_appointment_id,
        "notes": appt.notes,
        "revenue_amount": appt.revenue_amount,
        "created_at": appt.created_at.isoformat() if appt.created_at else None,
    }
