import uuid
import random
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.models import Call, CallAttempt, CallStatus, CallDirection, AttemptOutcome
from app.core.websocket import manager

logger = structlog.get_logger()

# Realistic fake phone numbers for dev simulation
FAKE_PATIENT_NUMBERS = [
    "+16175550101", "+13125550182", "+14155550193",
    "+17185550142", "+13235550167", "+12125550198",
]

CLINIC_NUMBER = "+18005559999"

FAKE_NOTES = [
    "Patient inquired about teeth whitening consultation",
    "Caller requested emergency appointment for tooth pain",
    "New patient asking about insurance acceptance",
    "Existing patient wants to reschedule cleaning",
    "Inquiry about Invisalign pricing and timeline",
    "Patient asking about crown replacement cost",
]

REVENUE_ESTIMATES = [450.0, 1200.0, 3500.0, 250.0, 800.0, 2100.0]


async def simulate_missed_call(
    client_id: str,
    db: AsyncSession,
    from_number: Optional[str] = None,
) -> Call:
    """
    Dev-mode: Creates a realistic fake missed call record and broadcasts it via WebSocket.
    """
    call_sid = f"sim_{uuid.uuid4().hex[:12]}"
    patient_number = from_number or random.choice(FAKE_PATIENT_NUMBERS)
    note = random.choice(FAKE_NOTES)
    revenue = random.choice(REVENUE_ESTIMATES)

    call = Call(
        client_id=uuid.UUID(client_id),
        call_sid=call_sid,
        from_number=patient_number,
        to_number=CLINIC_NUMBER,
        status=CallStatus.MISSED,
        direction=CallDirection.INBOUND,
        notes=note,
        revenue_estimate=revenue,
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    logger.info("Simulated missed call created", call_id=str(call.id), from_number=patient_number)

    # Broadcast to all connected WebSocket clients for this tenant
    await manager.broadcast_to_tenant(client_id, {
        "event": "call_created",
        "call": _serialize_call(call),
    })

    return call


async def record_inbound_call(
    client_id: str,
    call_sid: str,
    from_number: str,
    to_number: str,
    db: AsyncSession,
) -> Call:
    """Records a real inbound call (from Twilio webhook) as missed."""
    call = Call(
        client_id=uuid.UUID(client_id),
        call_sid=call_sid,
        from_number=from_number,
        to_number=to_number,
        status=CallStatus.MISSED,
        direction=CallDirection.INBOUND,
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    await manager.broadcast_to_tenant(client_id, {
        "event": "call_created",
        "call": _serialize_call(call),
    })

    return call


async def update_call_status(
    call_id: str,
    new_status: CallStatus,
    db: AsyncSession,
    client_id: Optional[str] = None,
) -> Call:
    """Updates a call's status and broadcasts the change via WebSocket."""
    stmt = select(Call).where(Call.id == uuid.UUID(call_id))
    result = await db.execute(stmt)
    call = result.scalar_one_or_none()

    if not call:
        raise ValueError(f"Call {call_id} not found")

    call.status = new_status
    await db.commit()
    await db.refresh(call)

    tenant_id = client_id or str(call.client_id)
    await manager.broadcast_to_tenant(tenant_id, {
        "event": "call_updated",
        "call": _serialize_call(call),
    })

    return call


async def get_tenant_calls(
    client_id: str,
    db: AsyncSession,
    status_filter: Optional[CallStatus] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Call]:
    """Returns paginated calls for a given tenant, newest first."""
    stmt = (
        select(Call)
        .where(Call.client_id == uuid.UUID(client_id))
        .order_by(desc(Call.created_at))
        .limit(limit)
        .offset(offset)
    )
    if status_filter:
        stmt = stmt.where(Call.status == status_filter)

    result = await db.execute(stmt)
    return result.scalars().all()


def _serialize_call(call: Call) -> dict:
    """Convert a Call ORM object to a JSON-serializable dict."""
    return {
        "id": str(call.id),
        "client_id": str(call.client_id),
        "call_sid": call.call_sid,
        "from_number": call.from_number,
        "to_number": call.to_number,
        "status": call.status.value,
        "direction": call.direction.value,
        "duration_seconds": call.duration_seconds,
        "notes": call.notes,
        "revenue_estimate": call.revenue_estimate,
        "created_at": call.created_at.isoformat() if call.created_at else None,
        "updated_at": call.updated_at.isoformat() if call.updated_at else None,
    }
