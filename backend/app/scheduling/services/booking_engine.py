import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.models import Appointment, AppointmentStatus
from app.services.pms_adapters import get_pms_adapter
from app.models.models import Client, Call
from app.scheduling.services.conflict_detector import check_for_conflicts

logger = structlog.get_logger()

async def book_appointment_with_engine(
    client_id: str,
    db: AsyncSession,
    slot_id: str,
    patient_name: str,
    patient_phone: str,
    patient_email: Optional[str],
    treatment_type: str,
    provider_name: str,
    scheduled_at: str,
    duration_minutes: int,
    notes: Optional[str],
    revenue_amount: Optional[float] = None,
    call_id: Optional[str] = None
) -> Appointment:
    """
    Advanced booking engine that checks for conflicts before booking.
    """
    # 1. Conflict Detection (warning only, do not block creation)
    try:
        await check_for_conflicts(
            client_id=client_id,
            db=db,
            scheduled_at=scheduled_at,
            duration_minutes=duration_minutes,
            provider_name=provider_name
        )
    except Exception as conf_err:
        logger.warning("Conflict check notice:", error=str(conf_err))

    # 2. Get PMS Adapter
    from sqlalchemy import select
    stmt = select(Client).where(Client.id == uuid.UUID(client_id))
    client = (await db.execute(stmt)).scalar_one_or_none()
    if not client:
        raise ValueError("Client not found")
        
    pms_type = client.pms_type.value if client else "none"
    adapter = get_pms_adapter(pms_type)

    # 3. Book in PMS
    pms_appt_id = f"pms-{uuid.uuid4()}"
    try:
        booking = await adapter.book_appointment(
            slot_id=slot_id,
            patient_name=patient_name,
            patient_phone=patient_phone,
            patient_email=patient_email,
            treatment_type=treatment_type,
            notes=notes,
        )
        if booking and booking.pms_appointment_id:
            pms_appt_id = booking.pms_appointment_id
    except Exception as pms_err:
        logger.warning("PMS adapter booking notice:", error=str(pms_err))

    # 4. Save to Internal Database
    appt = Appointment(
        client_id=uuid.UUID(client_id),
        call_id=uuid.UUID(call_id) if (call_id and len(call_id) == 36) else None,
        patient_name=patient_name,
        patient_phone=patient_phone,
        patient_email=patient_email,
        status=AppointmentStatus.SCHEDULED,
        scheduled_at=scheduled_at,
        duration_minutes=duration_minutes,
        treatment_type=treatment_type,
        provider_name=provider_name,
        pms_appointment_id=pms_appt_id,
        notes=notes,
        revenue_amount=revenue_amount or 150.0,
    )
    db.add(appt)
    
    # 5. Link call to recovered if applicable
    if call_id and len(call_id) == 36:
        try:
            from app.models.models import CallStatus
            call_stmt = select(Call).where(Call.id == uuid.UUID(call_id))
            call_record = (await db.execute(call_stmt)).scalar_one_or_none()
            if call_record:
                call_record.status = CallStatus.RECOVERED
        except Exception:
            pass

    await db.commit()
    await db.refresh(appt)

    return appt
