import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.models import Appointment, AppointmentStatus
from app.scheduling.models import ConflictLog

logger = structlog.get_logger()

class ConflictException(Exception):
    def __init__(self, message: str, conflict_type: str):
        super().__init__(message)
        self.conflict_type = conflict_type


async def check_for_conflicts(
    client_id: str,
    db: AsyncSession,
    scheduled_at: str,
    duration_minutes: int,
    provider_name: Optional[str] = None
) -> None:
    """
    Checks if a requested booking conflicts with existing appointments.
    Raises ConflictException if an overlap is found.
    """
    try:
        clean_iso = scheduled_at.replace("Z", "+00:00")
        req_start = datetime.fromisoformat(clean_iso)
    except Exception:
        req_start = datetime.now()
        
    day_str = req_start.strftime("%Y-%m-%d")
    
    # Get all active appointments on the same day for this client
    stmt = select(Appointment).where(
        Appointment.client_id == uuid.UUID(client_id),
        Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]),
        Appointment.scheduled_at.like(f"{day_str}%")
    )
    
    if provider_name:
        stmt = stmt.where(Appointment.provider_name == provider_name)
        
    existing_appts = (await db.execute(stmt)).scalars().all()
    
    from datetime import timedelta
    req_end = req_start + timedelta(minutes=duration_minutes)
    
    for appt in existing_appts:
        appt_start = datetime.fromisoformat(appt.scheduled_at)
        appt_end = appt_start + timedelta(minutes=appt.duration_minutes)
        
        # Overlap logic: StartA < EndB and EndA > StartB
        if req_start < appt_end and req_end > appt_start:
            conflict_msg = f"Double booking conflict with patient {appt.patient_name} at {appt.scheduled_at}"
            
            # Log the conflict
            try:
                conflict = ConflictLog(
                    client_id=uuid.UUID(client_id),
                    conflict_type="double_booking",
                    description=conflict_msg
                )
                db.add(conflict)
                await db.flush() # flush to get the ID without committing
            except Exception as log_err:
                logger.warning("Could not log conflict to conflict_logs table", error=str(log_err))
            
            raise ConflictException(conflict_msg, "double_booking")
