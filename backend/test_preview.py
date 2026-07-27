import asyncio
from app.ai.models import VoiceProfile, VoiceProvider, VoiceGender, VoiceLanguage
from app.ai.voice.voice_engine import synthesize_speech

async def main():
    profile = VoiceProfile(
        provider=VoiceProvider("elevenlabs"),
        voice_gender=VoiceGender("female"),
        language=VoiceLanguage("en-US"),
        speaking_speed=1.0,
        provider_voice_id="",
        provider_api_key=None
    )
    try:
        audio = await synthesize_speech("Hello World!", profile)
        print("Success! Audio length:", len(audio) if audio else "None")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
