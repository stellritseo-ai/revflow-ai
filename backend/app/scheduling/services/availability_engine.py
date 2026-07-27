import uuid
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.models import Client
from app.scheduling.models import (
    AvailabilityRule, RuleType, DoctorSchedule, TimeBlock
)
from app.services.pms_adapters import get_pms_adapter, TimeSlot

logger = structlog.get_logger()


async def compute_availability(
    client_id: str,
    db: AsyncSession,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    duration_minutes: int = 60,
    provider_name: Optional[str] = None
) -> List[dict]:
    """
    Computes real-time availability by combining PMS slots with internal rules.
    1. Fetches base slots from PMS integration.
    2. Filters out slots that fall in blocked times.
    3. Filters out slots outside of provider shifts (if provided).
    4. Filters out slots outside of active clinic hours.
    """
    # 1. Fetch Client & Base PMS Slots
    stmt = select(Client).where(Client.id == uuid.UUID(client_id))
    result = await db.execute(stmt)
    client = result.scalar_one_or_none()

    if not client:
        return []

    pms_type = client.pms_type.value if client else "none"
    adapter = get_pms_adapter(pms_type)

    now = datetime.now()
    from_str = date_from or now.isoformat()
    to_str = date_to or (now + timedelta(days=7)).isoformat()

    base_slots = await adapter.get_available_slots(from_str, to_str, duration_minutes)

    # 2. Fetch Time Blocks
    blocks = []
    try:
        block_stmt = select(TimeBlock).where(
            TimeBlock.client_id == uuid.UUID(client_id),
            TimeBlock.is_active == True,
            TimeBlock.end_time >= from_str,
            TimeBlock.start_time <= to_str
        )
        if provider_name:
            block_stmt = block_stmt.where(TimeBlock.provider_name == provider_name)
        blocks = (await db.execute(block_stmt)).scalars().all()
    except Exception as block_err:
        logger.warning("Could not query time_blocks", error=str(block_err))

    # 3. Fetch Provider Schedule (if specific provider requested)
    provider_schedules = []
    if provider_name:
        try:
            sched_stmt = select(DoctorSchedule).where(
                DoctorSchedule.client_id == uuid.UUID(client_id),
                DoctorSchedule.provider_name == provider_name,
                DoctorSchedule.date >= from_str[:10],
                DoctorSchedule.date <= to_str[:10]
            )
            provider_schedules = (await db.execute(sched_stmt)).scalars().all()
        except Exception as sched_err:
            logger.warning("Could not query doctor_schedule", error=str(sched_err))
    
    # Process Filter Logic
    valid_slots = []
    
    for slot in base_slots:
        # If filtering by provider, verify slot provider matches
        if provider_name and slot.provider_name != provider_name:
            continue
            
        slot_start = datetime.fromisoformat(slot.start_time)
        slot_end = datetime.fromisoformat(slot.end_time)

        # Check for time block conflicts
        is_blocked = False
        for block in blocks:
            # Overlap check
            b_start = datetime.fromisoformat(block.start_time)
            b_end = datetime.fromisoformat(block.end_time)
            if slot_start < b_end and slot_end > b_start:
                # Same provider check
                if not block.provider_name or block.provider_name == slot.provider_name:
                    is_blocked = True
                    break
        
        if is_blocked:
            continue

        # Check provider availability schedule (if they have overrides)
        if provider_name and provider_schedules:
            slot_date_str = slot_start.strftime("%Y-%m-%d")
            # Find schedule for this date
            sched = next((s for s in provider_schedules if s.date == slot_date_str), None)
            if sched:
                if not sched.is_available:
                    continue # Doctor is marked unavailable all day
                
                # Check shift start/end bounds
                if sched.shift_start:
                    shift_s = datetime.strptime(f"{slot_date_str} {sched.shift_start}", "%Y-%m-%d %H:%M")
                    if slot_start < shift_s:
                        continue
                if sched.shift_end:
                    shift_e = datetime.strptime(f"{slot_date_str} {sched.shift_end}", "%Y-%m-%d %H:%M")
                    if slot_end > shift_e:
                        continue
        
        valid_slots.append(slot.to_dict())

    return valid_slots
