"""
Communication Provider Protocol Interfaces.
All providers (Twilio, Sendgrid, etc) must implement these.
"""
from typing import Protocol, Optional, Any


class VoiceProvider(Protocol):
    """Protocol for Voice capabilities."""
    
    async def answer_call(self, call_id: str, greeting_audio: bytes) -> bool:
        ...

    async def transfer_call(self, call_id: str, to_number: str) -> bool:
        ...

    async def play_audio(self, call_id: str, audio: bytes) -> bool:
        ...

    async def record_call(self, call_id: str) -> bool:
        ...
        
    async def hangup(self, call_id: str) -> bool:
        ...


class SMSProvider(Protocol):
    """Protocol for SMS capabilities."""

    async def send_sms(self, to_number: str, from_number: str, text: str) -> dict:
        ...
        
    async def get_delivery_status(self, message_id: str) -> str:
        ...


class EmailProvider(Protocol):
    """Protocol for Email capabilities."""
    
    async def send_email(
        self, 
        to_email: str, 
        from_email: str, 
        subject: str, 
        body: str, 
        html_body: Optional[str] = None
    ) -> dict:
        ...


class ChatProvider(Protocol):
    """Protocol for Website Live Chat capabilities."""
    
    async def send_message(self, session_id: str, text: str) -> dict:
        ...
        
    async def set_typing_indicator(self, session_id: str, is_typing: bool) -> bool:
        ...


# --- Mock Implementations for testing the architecture ---

import structlog
logger = structlog.get_logger()

class MockSMSProvider:
    async def send_sms(self, to_number: str, from_number: str, text: str) -> dict:
        logger.info("MOCK_SMS_SENT", to=to_number, text=text)
        return {"id": "mock_sms_123", "status": "sent"}
        
    async def get_delivery_status(self, message_id: str) -> str:
        return "delivered"

class MockVoiceProvider:
    async def answer_call(self, call_id: str, greeting_audio: bytes) -> bool:
        logger.info("MOCK_VOICE_ANSWERED", call_id=call_id)
        return True
    async def transfer_call(self, call_id: str, to_number: str) -> bool:
        logger.info("MOCK_VOICE_TRANSFERRED", call_id=call_id, to=to_number)
        return True
    async def play_audio(self, call_id: str, audio: bytes) -> bool:
        logger.info("MOCK_VOICE_PLAY_AUDIO", call_id=call_id)
        return True
    async def record_call(self, call_id: str) -> bool:
        logger.info("MOCK_VOICE_RECORDING_STARTED", call_id=call_id)
        return True
    async def hangup(self, call_id: str) -> bool:
        logger.info("MOCK_VOICE_HANGUP", call_id=call_id)
        return True
