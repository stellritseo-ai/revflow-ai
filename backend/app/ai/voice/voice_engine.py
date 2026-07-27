"""
Voice Engine — Multi-provider TTS abstraction layer.
Supports Google TTS, ElevenLabs, Cartesia, Azure Speech, and mock mode.
"""
from __future__ import annotations
from typing import Optional
import structlog
import httpx

from app.ai.models import VoiceProfile, VoiceProvider, VoiceGender, VoiceLanguage

logger = structlog.get_logger()

# Voice gender → Google TTS voice name mapping
GOOGLE_VOICE_MAP = {
    VoiceGender.FEMALE: "en-US-Standard-C",
    VoiceGender.MALE: "en-US-Standard-B",
    VoiceGender.PROFESSIONAL_FEMALE: "en-US-Neural2-F",
    VoiceGender.PROFESSIONAL_MALE: "en-US-Neural2-D",
    VoiceGender.FRIENDLY_FEMALE: "en-US-Neural2-H",
    VoiceGender.FRIENDLY_MALE: "en-US-Neural2-I",
    VoiceGender.SOFT_FEMALE: "en-US-Neural2-G",
    VoiceGender.CALM_MALE: "en-US-Neural2-J",
}

# Language code → BCP-47 mapping
LANGUAGE_MAP = {
    VoiceLanguage.ENGLISH_US: "en-US",
    VoiceLanguage.ENGLISH_GB: "en-GB",
    VoiceLanguage.ENGLISH_AU: "en-AU",
    VoiceLanguage.ENGLISH_IN: "en-IN",
    VoiceLanguage.SPANISH: "es-ES",
    VoiceLanguage.FRENCH: "fr-FR",
}


async def synthesize_speech(
    text: str,
    voice_profile: Optional[VoiceProfile],
    api_key: Optional[str] = None,
) -> Optional[bytes]:
    """
    Synthesize speech using the configured voice provider.
    Returns raw audio bytes or None on failure.
    """
    if not voice_profile:
        return await _mock_audio(text)

    provider = voice_profile.provider

    if provider == VoiceProvider.GOOGLE_TTS:
        return await _synthesize_google_tts(text, voice_profile, api_key)
    elif provider == VoiceProvider.ELEVENLABS:
        return await _synthesize_elevenlabs(text, voice_profile)
    elif provider == VoiceProvider.AZURE_SPEECH:
        return await _synthesize_azure(text, voice_profile)
    else:
        return await _mock_audio(text, voice_profile)


async def _synthesize_google_tts(
    text: str,
    profile: VoiceProfile,
    api_key: Optional[str],
) -> Optional[bytes]:
    """Synthesize using Google Cloud TTS REST API."""
    if not api_key:
        logger.warning("Google TTS API key not configured")
        return await _mock_audio(text, profile)

    voice_name = GOOGLE_VOICE_MAP.get(profile.voice_gender, "en-US-Neural2-F")
    lang_code = LANGUAGE_MAP.get(profile.language, "en-US")

    payload = {
        "input": {"text": text},
        "voice": {
            "languageCode": lang_code,
            "name": voice_name,
        },
        "audioConfig": {
            "audioEncoding": "MP3",
            "speakingRate": profile.speaking_speed,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        import base64
        audio_content = data.get("audioContent", "")
        return base64.b64decode(audio_content) if audio_content else None

    except Exception as e:
        logger.error("Google TTS error", error=str(e))
        return None


async def _synthesize_elevenlabs(text: str, profile: VoiceProfile) -> Optional[bytes]:
    """Synthesize using ElevenLabs API."""
    if not profile.provider_api_key or not profile.provider_voice_id:
        logger.warning("ElevenLabs credentials not configured")
        return await _mock_audio(text, profile)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{profile.provider_voice_id}",
                headers={
                    "xi-api-key": profile.provider_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.8,
                        "speed": profile.speaking_speed,
                    }
                }
            )
            response.raise_for_status()
            return response.content

    except Exception as e:
        logger.error("ElevenLabs TTS error", error=str(e))
        return None


async def _synthesize_azure(text: str, profile: VoiceProfile) -> Optional[bytes]:
    """Synthesize using Azure Cognitive Speech Services."""
    if not profile.provider_api_key:
        return await _mock_audio(text, profile)

    lang_code = LANGUAGE_MAP.get(profile.language, "en-US")
    voice_name = f"{lang_code}-AriaNeural"  # Default Azure neural voice

    ssml = f"""<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{lang_code}'>
        <voice name='{voice_name}'>
            <prosody rate='{profile.speaking_speed}'>
                {text}
            </prosody>
        </voice>
    </speak>"""

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://eastus.tts.speech.microsoft.com/cognitiveservices/v1",
                headers={
                    "Ocp-Apim-Subscription-Key": profile.provider_api_key,
                    "Content-Type": "application/ssml+xml",
                    "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
                },
                content=ssml.encode("utf-8"),
            )
            response.raise_for_status()
            return response.content

    except Exception as e:
        logger.error("Azure TTS error", error=str(e))
        return None


import urllib.parse
import base64
from app.ai.voice.beep import BEEP_WAV_B64


async def _mock_audio(text: str, profile: Optional[VoiceProfile] = None) -> bytes:
    """Return a mock audio using free Google Translate TTS so it actually plays."""
    lang = "en"
    if profile and profile.language:
        try:
            lang = profile.language.value.split('-')[0]
        except AttributeError:
            lang = "en"
            
    url = f"https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&q={urllib.parse.quote(text)}&tl={lang}"
    try:
        # trust_env=False prevents local sandbox proxies from interfering if they are misconfigured
        async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            response.raise_for_status()
            return response.content
    except Exception as e:
        logger.error("Mock TTS error", error=str(e))
        # Valid WAV beep fallback if network is completely blocked
        return base64.b64decode(BEEP_WAV_B64)


def get_voice_preview_text(ai_name: str = "Aria", clinic_name: str = "your dental clinic") -> str:
    """Generate a voice preview text sample."""
    return (
        f"Hello! I'm {ai_name}, the AI receptionist for {clinic_name}. "
        "I'm here to help you schedule appointments, answer questions, and "
        "make sure you have everything you need. How can I assist you today?"
    )
