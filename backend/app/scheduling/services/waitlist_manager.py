import uuid
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import structlog
from datetime import datetime

from app.scheduling.models import Waitlist, WaitlistStatus

logger = structlog.get_logger()

async def find_waitlist_matches(
    client_id: str,
    db: AsyncSession,
    freed_slot_start: str,
    freed_slot_duration: int,
    treatment_type: Optional[str] = None
) -> List[dict]:
    """
    When an appointment is cancelled, this function searches the waitlist for matching patients.
    It checks if the freed slot matches their preferred day of week and time of day.
    """
    stmt = select(Waitlist).where(
        Waitlist.client_id == uuid.UUID(client_id),
        Waitlist.status == WaitlistStatus.ACTIVE
    )
    
    # Optionally filter by treatment type to ensure operatory capabilities match
    if treatment_type:
        stmt = stmt.where(
            (Waitlist.treatment_type == treatment_type) | (Waitlist.treatment_type == None)
        )
        
    waitlist_entries = (await db.execute(stmt)).scalars().all()
    
    matches = []
    slot_dt = datetime.fromisoformat(freed_slot_start)
    slot_day = slot_dt.weekday() # 0 = Monday
    slot_hour = slot_dt.hour
    
    for entry in waitlist_entries:
        # Check day preference
        if entry.preferred_days:
            # If they have preferences, check if today is one of them
            if slot_day not in entry.preferred_days:
                continue
                
        # Check time range preference
        if entry.preferred_time_range:
            pref = entry.preferred_time_range.lower()
            if pref == "morning" and slot_hour >= 12:
                continue
            if pref == "afternoon" and (slot_hour < 12 or slot_hour > 16):
                continue
            if pref == "evening" and slot_hour < 16:
                continue
                
        matches.append({
            "id": str(entry.id),
            "patient_name": entry.patient_name,
            "patient_phone": entry.patient_phone,
            "treatment_type": entry.treatment_type
        })
        
    return matches
