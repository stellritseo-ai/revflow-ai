"""
Twilio Service Layer — wraps the Twilio SDK.

In dev mode (no credentials), all methods log mock output and
return success so the full UI flow is testable without a Twilio account.

In production, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and
TWILIO_PHONE_NUMBER environment variables to activate real calls/SMS.
"""
import hmac
import hashlib
import base64
from typing import Optional
from urllib.parse import urlencode
import structlog

from app.core.config import settings

logger = structlog.get_logger()


def _get_client():
    """Lazily create Twilio client only when credentials are available."""
    if not settings.twilio_enabled:
        return None
    try:
        from twilio.rest import Client
        return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    except ImportError:
        logger.warning("twilio package not installed; running in mock mode")
        return None


def build_callback_twiml(clinic_name: str = "your clinic", greeting_text: str = "") -> str:
    """
    Returns TwiML XML that:
    1. Speaks a greeting to the patient (AI-generated or default)
    2. Opens a <Gather> to capture their speech response
    3. POSTs the transcript to /calls/webhook/gather for AI processing
    """
    spoken_greeting = greeting_text or (
        f"Hello! This is an automated callback from {clinic_name}. "
        f"We noticed you tried to reach us and we'd love to help. "
        f"Please briefly tell us how we can assist you today, and our AI will take it from there."
    )

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="8" speechTimeout="auto"
            action="/api/v1/calls/webhook/gather" method="POST"
            language="en-US">
        <Say voice="alice">{spoken_greeting}</Say>
    </Gather>
    <Say voice="alice">We didn't catch that. No worries — our team will follow up with you shortly. Goodbye!</Say>
</Response>"""


def build_ai_response_twiml(ai_text: str, gather_next: bool = False) -> str:
    """
    Returns TwiML that speaks the AI's response to the patient.
    If gather_next is True, opens another <Gather> for a follow-up turn.
    """
    if gather_next:
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="8" speechTimeout="auto"
            action="/api/v1/calls/webhook/gather" method="POST"
            language="en-US">
        <Say voice="alice">{ai_text}</Say>
    </Gather>
    <Say voice="alice">Thank you for your time. Our team will be in touch shortly. Have a great day!</Say>
</Response>"""
    else:
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">{ai_text}</Say>
    <Say voice="alice">Thank you for calling {{}}, and have a wonderful day!</Say>
</Response>"""


def build_inbound_twiml() -> str:
    """
    TwiML response for inbound calls — inform caller and mark as missed.
    """
    return """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">
        Thank you for calling. All our team members are currently unavailable.
        Our AI assistant will call you back shortly. Goodbye.
    </Say>
</Response>"""


def build_media_stream_twiml(client_id: str) -> str:
    """
    TwiML response that instructs Twilio to connect the call audio to our WebSocket.
    Passes the client_id so the WebSocket knows which AI profile to load.
    """
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{settings.media_stream_url}?client_id={client_id}" />
    </Connect>
</Response>"""


async def make_outbound_call(
    to_number: str,
    callback_twiml_url: str,
    status_callback_url: Optional[str] = None,
) -> Optional[str]:
    """
    Initiates an outbound Twilio call to `to_number`.
    Returns the Twilio call SID on success, or None in mock mode.

    Args:
        to_number: Patient E.164 number (e.g. +16175550101)
        callback_twiml_url: URL Twilio will fetch for TwiML instructions
        status_callback_url: URL Twilio will POST status updates to
    """
    client = _get_client()

    if client is None:
        logger.info(
            "MOCK: Outbound call initiated",
            to=to_number,
            from_=settings.TWILIO_PHONE_NUMBER or "MOCK_NUMBER",
        )
        return f"mock_call_{to_number.replace('+', '').replace(' ', '_')}"

    try:
        call = client.calls.create(
            to=to_number,
            from_=settings.TWILIO_PHONE_NUMBER,
            url=callback_twiml_url,
            status_callback=status_callback_url,
            status_callback_method="POST",
        )
        logger.info("Twilio outbound call created", call_sid=call.sid, to=to_number)
        return call.sid
    except Exception as e:
        logger.error("Twilio outbound call failed", error=str(e), to=to_number)
        raise ValueError(f"Twilio call failed: {str(e)}")


async def trigger_studio_flow(
    to_number: str,
    flow_sid: Optional[str] = None,
    parameters: Optional[dict] = None,
) -> Optional[str]:
    """
    Triggers a Twilio Studio Flow execution for the given phone number.

    This is the preferred method when a Studio Flow SID is configured —
    it gives you full visual control over the call script in the Twilio Studio editor.

    Args:
        to_number: Patient E.164 number (e.g. +16175550101)
        flow_sid: Override the default TWILIO_FLOW_SID from settings
        parameters: Dict of variables passed to the Studio Flow as {{flow.data.*}}
                    e.g. {"clinic_name": "Revitalize Tampa", "callback_reason": "missed_call"}

    Returns:
        Execution SID on success, or a mock SID in dev mode.
    """
    sid = flow_sid or settings.TWILIO_FLOW_SID
    client = _get_client()

    if client is None or not sid:
        mock_execution_sid = f"mock_flow_{to_number.replace('+', '').replace(' ', '_')}"
        logger.info(
            "MOCK: Studio Flow execution triggered",
            flow_sid=sid or "NOT_SET",
            to=to_number,
            execution_sid=mock_execution_sid,
        )
        return mock_execution_sid

    try:
        execution = client.studio.v2.flows(sid).executions.create(
            to=to_number,
            from_=settings.TWILIO_PHONE_NUMBER,
            parameters=parameters or {},
        )
        logger.info(
            "Twilio Studio Flow execution started",
            execution_sid=execution.sid,
            flow_sid=sid,
            to=to_number,
        )
        return execution.sid
    except Exception as e:
        logger.error("Twilio Studio Flow execution failed", error=str(e), to=to_number, flow_sid=sid)
        raise ValueError(f"Studio Flow trigger failed: {str(e)}")


async def send_sms(to_number: str, message: str) -> bool:
    """
    Sends an SMS to the patient.
    Returns True on success, False on failure.
    Logs mock output in dev mode.
    """
    client = _get_client()

    if client is None:
        logger.info("MOCK: SMS sent", to=to_number, body=message[:60] + "...")
        return True

    try:
        msg = client.messages.create(
            to=to_number,
            from_=settings.TWILIO_PHONE_NUMBER,
            body=message,
        )
        logger.info("Twilio SMS sent", message_sid=msg.sid, to=to_number)
        return True
    except Exception as e:
        logger.error("Twilio SMS failed", error=str(e), to=to_number)
        return False


def verify_twilio_signature(
    request_url: str,
    post_params: dict,
    twilio_signature: str,
) -> bool:
    """
    Validates that an incoming webhook request is genuinely from Twilio.
    Always returns True in dev mode (no credentials or ENVIRONMENT=development).
    """
    if not settings.twilio_enabled or settings.ENVIRONMENT == "development":
        logger.debug("Twilio signature check skipped (dev mode)")
        return True

    try:
        from twilio.request_validator import RequestValidator
        validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
        return validator.validate(request_url, post_params, twilio_signature)
    except Exception as e:
        logger.warning("Twilio signature validation error", error=str(e))
        return False


async def test_credentials(account_sid: str, auth_token: str) -> bool:
    """
    Tests if the provided Twilio credentials are valid by making a lightweight
    API call (fetches account details).
    """
    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        account = client.api.accounts(account_sid).fetch()
        return account.status == "active"
    except Exception as e:
        logger.warning("Twilio credential test failed", error=str(e))
        return False
