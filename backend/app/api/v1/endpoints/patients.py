from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import structlog
import uuid

from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant
from app.models.models import Call, Appointment

router = APIRouter()
logger = structlog.get_logger()

class PatientResponse(BaseModel):
    phone: str
    name: str
    email: Optional[str] = None
    total_calls: int
    total_bookings: int
    last_interaction: Optional[str] = None
    ai_notes: Optional[str] = None

@router.get("", response_model=List[PatientResponse])
async def list_patients(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves unique patients associated with this tenant clinic.
    Aggregates patient records from calls and appointments databases.
    """
    client_uuid = ctx.client_id
    if not client_uuid:
        raise HTTPException(status_code=403, detail="Clinic tenant context required")

    # 1. Fetch appointments to get phone -> name, email mappings & booking count
    appt_stmt = select(
        Appointment.patient_phone,
        Appointment.patient_name,
        Appointment.patient_email,
        func.count(Appointment.id).label("booking_count"),
        func.max(Appointment.created_at).label("last_appt")
    ).where(
        Appointment.client_id == client_uuid
    ).group_by(
        Appointment.patient_phone,
        Appointment.patient_name,
        Appointment.patient_email
    )
    appt_res = await db.execute(appt_stmt)
    
    # Store appt details by phone
    patient_map = {}
    for row in appt_res.all():
        phone = row[0]
        patient_map[phone] = {
            "phone": phone,
            "name": row[1] or "Unknown Patient",
            "email": row[2],
            "total_bookings": row[3],
            "last_interaction": row[4].isoformat() if row[4] else None,
            "total_calls": 0,
            "ai_notes": None
        }

    # 2. Fetch calls to get call count, notes, and cover patients who didn't book yet
    call_stmt = select(
        Call.from_number,
        func.count(Call.id).label("call_count"),
        func.max(Call.created_at).label("last_call"),
        func.max(Call.notes).label("ai_notes") # Takes latest non-null notes
    ).where(
        Call.client_id == client_uuid
    ).group_by(
        Call.from_number
    )
    call_res = await db.execute(call_stmt)

    for row in call_res.all():
        phone = row[0]
        call_count = row[1]
        last_call_iso = row[2].isoformat() if row[2] else None
        notes = row[3]

        if phone in patient_map:
            patient_map[phone]["total_calls"] = call_count
            patient_map[phone]["ai_notes"] = notes
            # Compare and take the latest interaction timestamp
            if last_call_iso and (not patient_map[phone]["last_interaction"] or last_call_iso > patient_map[phone]["last_interaction"]):
                patient_map[phone]["last_interaction"] = last_call_iso
        else:
            patient_map[phone] = {
                "phone": phone,
                "name": "Anonymous Caller",
                "email": None,
                "total_bookings": 0,
                "total_calls": call_count,
                "last_interaction": last_call_iso,
                "ai_notes": notes
            }

    # Return as list sorted by latest interaction
    patients = list(patient_map.values())
    patients.sort(key=lambda x: x["last_interaction"] or "", reverse=True)

    return patients
