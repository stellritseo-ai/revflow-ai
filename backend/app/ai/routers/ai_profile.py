"""
AI Profile Router — CRUD for clinic AI receptionist profiles.
"""
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.ai.models import AIProfile, PersonalityStyle, ResponseLength

router = APIRouter(prefix="/ai/profile", tags=["AI Profile"])


class AIProfileResponse(BaseModel):
    id: Optional[str] = None
    ai_name: str
    receptionist_name: str
    greeting_message: Optional[str] = None
    personality: str
    response_length: str
    emergency_rules: Optional[str] = None
    escalation_rules: Optional[str] = None
    booking_rules: Optional[str] = None
    business_rules: Optional[str] = None
    insurance_rules: Optional[str] = None
    appointment_rules: Optional[str] = None
    custom_instructions: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class AIProfileUpdate(BaseModel):
    ai_name: Optional[str] = None
    receptionist_name: Optional[str] = None
    greeting_message: Optional[str] = None
    personality: Optional[str] = None
    response_length: Optional[str] = None
    emergency_rules: Optional[str] = None
    escalation_rules: Optional[str] = None
    booking_rules: Optional[str] = None
    business_rules: Optional[str] = None
    insurance_rules: Optional[str] = None
    appointment_rules: Optional[str] = None
    custom_instructions: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("", response_model=AIProfileResponse)
async def get_ai_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the AI profile for the current clinic."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(AIProfile).where(AIProfile.client_id == current_user.client_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        # Return defaults if no profile exists
        return AIProfileResponse(
            ai_name="Aria",
            receptionist_name="Aria",
            greeting_message=(
                "Hello! Thank you for calling. I'm Aria, your AI dental receptionist. "
                "How can I help you today?"
            ),
            personality=PersonalityStyle.PROFESSIONAL.value,
            response_length=ResponseLength.STANDARD.value,
            is_active=True,
        )

    return AIProfileResponse(
        id=str(profile.id),
        ai_name=profile.ai_name,
        receptionist_name=profile.receptionist_name,
        greeting_message=profile.greeting_message,
        personality=profile.personality.value,
        response_length=profile.response_length.value,
        emergency_rules=profile.emergency_rules,
        escalation_rules=profile.escalation_rules,
        booking_rules=profile.booking_rules,
        business_rules=profile.business_rules,
        insurance_rules=profile.insurance_rules,
        appointment_rules=profile.appointment_rules,
        custom_instructions=profile.custom_instructions,
        is_active=profile.is_active,
    )


@router.put("", response_model=AIProfileResponse)
async def upsert_ai_profile(
    payload: AIProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update the AI profile for the current clinic."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(AIProfile).where(AIProfile.client_id == current_user.client_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = AIProfile(client_id=current_user.client_id)
        db.add(profile)

    # Update fields
    update_data = payload.model_dump(exclude_none=True)
    for key, value in update_data.items():
        if key == "personality":
            try:
                value = PersonalityStyle(value)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid personality: {value}")
        elif key == "response_length":
            try:
                value = ResponseLength(value)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid response_length: {value}")
        setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)

    return AIProfileResponse(
        id=str(profile.id),
        ai_name=profile.ai_name,
        receptionist_name=profile.receptionist_name,
        greeting_message=profile.greeting_message,
        personality=profile.personality.value,
        response_length=profile.response_length.value,
        emergency_rules=profile.emergency_rules,
        escalation_rules=profile.escalation_rules,
        booking_rules=profile.booking_rules,
        business_rules=profile.business_rules,
        insurance_rules=profile.insurance_rules,
        appointment_rules=profile.appointment_rules,
        custom_instructions=profile.custom_instructions,
        is_active=profile.is_active,
    )
