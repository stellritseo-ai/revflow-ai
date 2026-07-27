"""
Voice Profile Router — Manage per-clinic TTS voice configuration.
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
from app.ai.models import VoiceProfile, VoiceGender, VoiceProvider, VoiceLanguage
from app.ai.voice.voice_engine import GOOGLE_VOICE_MAP, LANGUAGE_MAP, get_voice_preview_text, synthesize_speech
from fastapi.responses import Response

router = APIRouter(prefix="/ai/voice", tags=["Voice Configuration"])


class VoiceProfileResponse(BaseModel):
    id: Optional[str] = None
    voice_gender: str
    provider: str
    language: str
    speaking_speed: float
    speaking_style: str
    provider_voice_id: Optional[str] = None

    class Config:
        from_attributes = True


class VoiceProfileUpdate(BaseModel):
    voice_gender: Optional[str] = None
    provider: Optional[str] = None
    language: Optional[str] = None
    speaking_speed: Optional[float] = None
    speaking_style: Optional[str] = None
    provider_voice_id: Optional[str] = None
    provider_api_key: Optional[str] = None


class VoiceOptionsResponse(BaseModel):
    genders: list
    providers: list
    languages: list
    styles: list


@router.get("/options", response_model=VoiceOptionsResponse)
async def get_voice_options():
    """Get all available voice configuration options."""
    return VoiceOptionsResponse(
        genders=[
            {"value": "female", "label": "Female"},
            {"value": "male", "label": "Male"},
            {"value": "professional_female", "label": "Professional Female"},
            {"value": "professional_male", "label": "Professional Male"},
            {"value": "friendly_female", "label": "Friendly Female"},
            {"value": "friendly_male", "label": "Friendly Male"},
            {"value": "soft_female", "label": "Soft Female"},
            {"value": "calm_male", "label": "Calm Male"},
        ],
        providers=[
            {"value": "google_tts", "label": "Google Cloud TTS", "description": "High quality neural voices"},
            {"value": "elevenlabs", "label": "ElevenLabs", "description": "Ultra-realistic AI voices"},
            {"value": "cartesia", "label": "Cartesia", "description": "Ultra low-latency voices"},
            {"value": "azure_speech", "label": "Azure Speech", "description": "Microsoft neural voices"},
            {"value": "mock", "label": "Test Mode", "description": "For development/testing"},
        ],
        languages=[
            {"value": "en-US", "label": "English (US)", "accent": "American"},
            {"value": "en-GB", "label": "English (UK)", "accent": "British"},
            {"value": "en-AU", "label": "English (AU)", "accent": "Australian"},
            {"value": "en-IN", "label": "English (IN)", "accent": "Indian"},
            {"value": "es-ES", "label": "Spanish", "accent": "Spanish"},
            {"value": "fr-FR", "label": "French", "accent": "French"},
        ],
        styles=[
            {"value": "professional", "label": "Professional"},
            {"value": "friendly", "label": "Friendly"},
            {"value": "calm", "label": "Calm"},
            {"value": "warm", "label": "Warm"},
            {"value": "energetic", "label": "Energetic"},
        ],
    )


@router.get("", response_model=VoiceProfileResponse)
async def get_voice_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get voice profile for current clinic."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(VoiceProfile).where(VoiceProfile.client_id == current_user.client_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        return VoiceProfileResponse(
            voice_gender=VoiceGender.PROFESSIONAL_FEMALE.value,
            provider=VoiceProvider.GOOGLE_TTS.value,
            language=VoiceLanguage.ENGLISH_US.value,
            speaking_speed=1.0,
            speaking_style="professional",
        )

    return VoiceProfileResponse(
        id=str(profile.id),
        voice_gender=profile.voice_gender.value,
        provider=profile.provider.value,
        language=profile.language.value,
        speaking_speed=profile.speaking_speed,
        speaking_style=profile.speaking_style,
        provider_voice_id=profile.provider_voice_id,
    )


@router.put("", response_model=VoiceProfileResponse)
async def upsert_voice_profile(
    payload: VoiceProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update voice profile for current clinic."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(VoiceProfile).where(VoiceProfile.client_id == current_user.client_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = VoiceProfile(client_id=current_user.client_id)
        db.add(profile)

    update_data = payload.model_dump(exclude_none=True)
    for key, value in update_data.items():
        if key == "voice_gender":
            try:
                value = VoiceGender(value)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid voice_gender: {value}")
        elif key == "provider":
            try:
                value = VoiceProvider(value)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid provider: {value}")
        elif key == "language":
            try:
                value = VoiceLanguage(value)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid language: {value}")
        elif key == "speaking_speed":
            value = max(0.5, min(2.0, float(value)))
        setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)

    return VoiceProfileResponse(
        id=str(profile.id),
        voice_gender=profile.voice_gender.value,
        provider=profile.provider.value,
        language=profile.language.value,
        speaking_speed=profile.speaking_speed,
        speaking_style=profile.speaking_style,
        provider_voice_id=profile.provider_voice_id,
    )


@router.post("/preview")
async def preview_voice(
    payload: VoiceProfileUpdate,
):
    """Generate audio preview for the given configuration."""
    # Create temporary VoiceProfile for synthesis
    profile = VoiceProfile(
        provider=VoiceProvider(payload.provider) if payload.provider else VoiceProvider.GOOGLE_TTS,
        voice_gender=VoiceGender(payload.voice_gender) if payload.voice_gender else VoiceGender.FEMALE,
        language=VoiceLanguage(payload.language) if payload.language else VoiceLanguage.ENGLISH_US,
        speaking_speed=payload.speaking_speed or 1.0,
        provider_voice_id=payload.provider_voice_id,
        provider_api_key=payload.provider_api_key,
    )

    text = get_voice_preview_text(ai_name="Aria", clinic_name="your clinic")

    audio_bytes = await synthesize_speech(text, profile, api_key=payload.provider_api_key)
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Failed to generate voice preview")

    return Response(content=audio_bytes, media_type="audio/mpeg")
