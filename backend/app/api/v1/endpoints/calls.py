from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Request, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import json
import structlog

from app.core.database import get_db
from app.core.config import settings
from app.core.tenant import TenantContext, require_tenant
from app.core.websocket import manager
from app.models.models import CallStatus, Call, Client
from app.ai.models import AIProfile
from app.services import call_service
from app.services import twilio_service, ai_service
from app.services.gemini_live_service import get_gemini_text_response
from app.services.ai_booking_service import handle_booking_conversation

logger = structlog.get_logger()
router = APIRouter()


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class CallResponse(BaseModel):
    id: str
    client_id: str
    call_sid: str
    from_number: str
    to_number: str
    status: str
    direction: str
    duration_seconds: Optional[int]
    notes: Optional[str]
    revenue_estimate: Optional[float]
    created_at: Optional[str]
    updated_at: Optional[str]


class SimulateCallRequest(BaseModel):
    from_number: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: CallStatus


class DialRequest(BaseModel):
    """Optional override for the outbound call's destination."""
    to_number: Optional[str] = None   # defaults to call.from_number


class SmsRequest(BaseModel):
    to_number: str
    message: str


# ─── REST: List Calls ─────────────────────────────────────────────────────────

@router.get("", response_model=List[CallResponse])
async def list_calls(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List all calls for the current tenant, newest first."""
    status_enum = None
    if status_filter:
        try:
            status_enum = CallStatus(status_filter)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status_filter}")

    calls = await call_service.get_tenant_calls(
        client_id=str(ctx.client_id),
        db=db,
        status_filter=status_enum,
        limit=limit,
        offset=offset,
    )
    return [call_service._serialize_call(c) for c in calls]


# ─── REST: Simulate Call (Dev Mode) ───────────────────────────────────────────

@router.post("/simulate", response_model=CallResponse, status_code=status.HTTP_201_CREATED)
async def simulate_missed_call(
    payload: SimulateCallRequest,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Dev-mode: Creates a fake missed call and broadcasts it via WebSocket."""
    call = await call_service.simulate_missed_call(
        client_id=str(ctx.client_id),
        db=db,
        from_number=payload.from_number,
    )
    return call_service._serialize_call(call)


# ─── REST: Update Status ──────────────────────────────────────────────────────

@router.patch("/{call_id}/status", response_model=CallResponse)
async def update_call_status(
    call_id: str,
    payload: UpdateStatusRequest,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Update a call's status and broadcast the change via WebSocket."""
    try:
        call = await call_service.update_call_status(
            call_id=call_id,
            new_status=payload.status,
            db=db,
            client_id=str(ctx.client_id),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return call_service._serialize_call(call)


# ─── REST: Initiate Outbound Callback ─────────────────────────────────────────

@router.post("/{call_id}/dial", response_model=CallResponse)
async def dial_patient_callback(
    call_id: str,
    payload: DialRequest,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Initiates an outbound Twilio callback call to the patient from a missed call.
    Works in dev mock mode if Twilio credentials are not set.
    """
    # Fetch the call record
    import uuid
    stmt = select(Call).where(Call.id == uuid.UUID(call_id))
    result = await db.execute(stmt)
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    # Determine destination number
    to_number = payload.to_number or call.from_number

    # Build the TwiML callback URL using the configured public WEBHOOK_BASE_URL
    twiml_url = settings.twiml_callback_url
    status_cb_url = settings.status_callback_url

    # Fetch clinic name for flow parameters
    client_stmt = select(Client).where(Client.id == ctx.client_id)
    client_result = await db.execute(client_stmt)
    clinic = client_result.scalar_one_or_none()
    clinic_name = clinic.clinic_name if clinic else "our clinic"

    # Initiate the call: prefer Studio Flow if configured, else use raw TwiML call
    try:
        if settings.studio_flow_enabled:
            try:
                call_sid = await twilio_service.trigger_studio_flow(
                    to_number=to_number,
                    parameters={
                        "clinic_name": clinic_name,
                        "call_id": call_id,
                        "callback_reason": "missed_call",
                    },
                )
                logger.info("Studio Flow triggered", flow_sid=settings.TWILIO_FLOW_SID, to=to_number)
            except Exception as flow_err:
                logger.warning(f"Studio Flow failed ({flow_err}), falling back to direct outbound call")
                call_sid = await twilio_service.make_outbound_call(
                    to_number=to_number,
                    callback_twiml_url=twiml_url,
                    status_callback_url=status_cb_url,
                )
        else:
            call_sid = await twilio_service.make_outbound_call(
                to_number=to_number,
                callback_twiml_url=twiml_url,
                status_callback_url=status_cb_url,
            )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Update call status to calling_back
    updated_call = await call_service.update_call_status(
        call_id=call_id,
        new_status=CallStatus.CALLING_BACK,
        db=db,
        client_id=str(ctx.client_id),
    )

    await twilio_service.send_sms(
        to_number=to_number,
        message=f"Hi! {clinic_name} is calling you back shortly regarding your recent inquiry. "
                f"If you miss our call, reply BOOK to schedule an appointment.",
    )

    logger.info("Outbound callback initiated", call_id=call_id, to=to_number, call_sid=call_sid)
    return call_service._serialize_call(updated_call)


# ─── Twilio Webhooks ──────────────────────────────────────────────────────────

import asyncio
from fastapi import BackgroundTasks
from app.core.database import AsyncSessionLocal

async def execute_delayed_callback(call_id: str, client_id: str, to_number: str):
    """Waits 20 seconds then automatically triggers the outbound AI call."""
    await asyncio.sleep(20)
    
    # Open a new database session since the original request has ended
    async with AsyncSessionLocal() as db:
        # Fetch the call and client
        import uuid
        stmt = select(Call).where(Call.id == uuid.UUID(call_id))
        result = await db.execute(stmt)
        call = result.scalar_one_or_none()
        
        client_stmt = select(Client).where(Client.id == uuid.UUID(client_id))
        client_result = await db.execute(client_stmt)
        clinic = client_result.scalar_one_or_none()
        
        if not call or call.status != CallStatus.MISSED:
            return  # Call was already recovered manually or doesn't exist

        clinic_name = clinic.clinic_name if clinic else "our clinic"
        twiml_url = settings.twiml_callback_url
        status_cb_url = settings.status_callback_url

        try:
            if settings.studio_flow_enabled:
                try:
                    call_sid = await twilio_service.trigger_studio_flow(
                        to_number=to_number,
                        parameters={
                            "clinic_name": clinic_name,
                            "call_id": call_id,
                            "callback_reason": "missed_call",
                        },
                    )
                except Exception as flow_err:
                    logger.warning(f"Studio Flow failed in auto callback ({flow_err}), falling back to direct call")
                    call_sid = await twilio_service.make_outbound_call(
                        to_number=to_number,
                        callback_twiml_url=twiml_url,
                        status_callback_url=status_cb_url,
                    )
            else:
                call_sid = await twilio_service.make_outbound_call(
                    to_number=to_number,
                    callback_twiml_url=twiml_url,
                    status_callback_url=status_cb_url,
                )
                
            # Update status
            await call_service.update_call_status(
                call_id=call_id,
                new_status=CallStatus.CALLING_BACK,
                db=db,
                client_id=client_id,
            )
            
            await twilio_service.send_sms(
                to_number=to_number,
                message=f"Hi! {clinic_name} is calling you back shortly regarding your recent inquiry. "
                        f"If you miss our call, reply BOOK to schedule an appointment.",
            )
            logger.info("Auto callback triggered", call_id=call_id, to=to_number)
        except Exception as e:
            logger.error(f"Auto callback failed: {e}")


@router.post("/webhook/inbound")
async def twilio_inbound_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio webhook: fired when a call arrives at your Twilio number.
    Verifies the Twilio signature, creates a missed call record,
    and returns TwiML instructing Twilio what to say.
    """
    form = await request.form()
    form_data = dict(form)

    # Verify signature in production
    twilio_sig = request.headers.get("X-Twilio-Signature", "")
    is_valid = twilio_service.verify_twilio_signature(
        request_url=str(request.url),
        post_params=form_data,
        twilio_signature=twilio_sig,
    )
    if not is_valid and settings.ENVIRONMENT == "production":
        logger.warning("Invalid Twilio signature on inbound webhook")
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    import xml.sax.saxutils as saxutils

    try:
        call_sid = form_data.get("CallSid", "")
        from_number = form_data.get("From", "")
        to_number = form_data.get("To", "")
        call_status = form_data.get("CallStatus", "")

        logger.info("Twilio inbound call", call_sid=call_sid, from_=from_number, to=to_number, status=call_status)

        # Find clinic by the Twilio phone number (to_number)
        client_stmt = select(Client).where(Client.phone == to_number).limit(1)
        client_result = await db.execute(client_stmt)
        client = client_result.scalar_one_or_none()

        # Fallback for development/testing: use the first client if none matches
        if not client and settings.ENVIRONMENT == "development":
            fallback_stmt = select(Client).limit(1)
            fallback_result = await db.execute(fallback_stmt)
            client = fallback_result.scalar_one_or_none()
            if client:
                logger.info("Using fallback development client", client_id=str(client.id))

        gather_url = f"{settings.WEBHOOK_BASE_URL}/api/v1/calls/webhook/gather"

        if client:
            await call_service.record_inbound_call(
                client_id=str(client.id),
                call_sid=call_sid,
                from_number=from_number,
                to_number=to_number,
                db=db,
            )

            # Load AI profile for personalized greeting
            profile_stmt = select(AIProfile).where(AIProfile.client_id == client.id).limit(1)
            profile_result = await db.execute(profile_stmt)
            profile = profile_result.scalar_one_or_none()

            ai_name = (profile.ai_name if profile else None) or "Aria"
            raw_greeting = (
                (profile.greeting_message if profile else None)
                or f"Hello! Thank you for calling {client.clinic_name}. I'm {ai_name}, your AI receptionist. How can I help you today?"
            )
            # XML-escape so clinic names with & or ' don't break TwiML
            greeting = saxutils.escape(raw_greeting)

            twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="10" speechTimeout="auto"
            action="{gather_url}" method="POST"
            language="en-US">
        <Say voice="alice">{greeting}</Say>
    </Gather>
    <Say voice="alice">We didn't catch that. Our team will follow up with you shortly. Goodbye!</Say>
</Response>"""
            return Response(content=twiml, media_type="application/xml")
        else:
            twiml = twilio_service.build_inbound_twiml()
            return Response(content=twiml, media_type="application/xml")

    except Exception as e:
        logger.error(f"Inbound webhook error: {e}", exc_info=True)
        # Always return valid TwiML — never a 500
        gather_url = f"{settings.WEBHOOK_BASE_URL}/api/v1/calls/webhook/gather"
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="10" speechTimeout="auto"
            action="{gather_url}" method="POST"
            language="en-US">
        <Say voice="alice">Hello! Thank you for calling. I am your AI receptionist. How can I help you today?</Say>
    </Gather>
    <Say voice="alice">Thank you for calling. Goodbye!</Say>
</Response>"""
        return Response(content=twiml, media_type="application/xml")


@router.post("/webhook/status")
async def twilio_status_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio status callback: fired when an outbound call's status changes.
    Updates the call record accordingly (answered → recovered, no-answer → failed).
    """
    form = await request.form()
    form_data = dict(form)

    call_sid = form_data.get("CallSid", "")
    call_status = form_data.get("CallStatus", "")
    duration = form_data.get("CallDuration", None)

    logger.info("Twilio status callback", call_sid=call_sid, call_status=call_status)

    # Map Twilio status to our status
    status_map = {
        "completed": CallStatus.RECOVERED,
        "answered": CallStatus.CALLING_BACK,
        "no-answer": CallStatus.FAILED,
        "busy": CallStatus.FAILED,
        "failed": CallStatus.FAILED,
        "canceled": CallStatus.FAILED,
    }
    new_status = status_map.get(call_status)

    if new_status and call_sid:
        import uuid as _uuid
        stmt = select(Call).where(Call.call_sid == call_sid)
        result = await db.execute(stmt)
        call = result.scalar_one_or_none()
        if call:
            if duration:
                call.duration_seconds = int(duration)
            await call_service.update_call_status(
                call_id=str(call.id),
                new_status=new_status,
                db=db,
                client_id=str(call.client_id),
            )

    return {"received": True}


@router.get("/twiml/callback")
@router.post("/twiml/callback")
async def serve_callback_twiml(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Serves the TwiML script that Twilio reads when a patient picks up the callback call.
    """
    # Optionally look up clinic name from the To number
    form = {}
    try:
        form = dict(await request.form())
    except Exception:
        pass

    to_number = form.get("To", "")
    clinic_name = "your clinic"
    if to_number:
        client_stmt = select(Client).where(Client.phone == to_number).limit(1)
        client_result = await db.execute(client_stmt)
        client = client_result.scalar_one_or_none()
        if client:
            clinic_name = client.clinic_name

    twiml = twilio_service.build_callback_twiml(clinic_name)
    return Response(content=twiml, media_type="application/xml")


# ─── AI Webhook: Speech Gather (Twilio calls this after patient speaks) ────────

@router.post("/webhook/gather")
async def twilio_gather_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio calls this endpoint after collecting patient speech via <Gather>.
    The AI analyzes the transcript and returns dynamic TwiML response.
    Updates the Call record with AI qualification notes.
    """
    form = await request.form()
    form_data = dict(form)

    call_sid = form_data.get("CallSid", "")
    speech_result = form_data.get("SpeechResult", "")
    confidence = form_data.get("Confidence", "0")

    logger.info(
        "Twilio gather received",
        call_sid=call_sid,
        speech=speech_result[:60] if speech_result else "(empty)",
        confidence=confidence,
    )

    # Look up call by SID — initialize BOTH to None to avoid NameError
    import uuid as _uuid
    import xml.sax.saxutils as saxutils
    call = None
    client = None
    clinic_name = "your clinic"
    if call_sid:
        stmt = select(Call).where(Call.call_sid == call_sid)
        result = await db.execute(stmt)
        call = result.scalar_one_or_none()
        if call:
            client_stmt = select(Client).where(Client.id == call.client_id)
            client_result = await db.execute(client_stmt)
            client = client_result.scalar_one_or_none()
            if client:
                clinic_name = client.clinic_name

    gather_url = f"{settings.WEBHOOK_BASE_URL}/api/v1/calls/webhook/gather"

    if not speech_result:
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="10" speechTimeout="auto"
            action="{gather_url}" method="POST"
            language="en-US">
        <Say voice="alice">I'm sorry, I didn't catch that. Could you please repeat?</Say>
    </Gather>
    <Say voice="alice">No worries, our team will follow up with you shortly. Goodbye!</Say>
</Response>"""
        return Response(content=twiml, media_type="application/xml")

    # Wrap everything in try/except so we NEVER return HTTP 500
    try:
        if call and client:
            ai_reply = await handle_booking_conversation(
                speech=speech_result,
                call=call,
                client=client,
                db=db,
            )
        else:
            ai_reply = await get_gemini_text_response(
                user_text=speech_result,
                system_prompt=(
                    f"You are an AI receptionist for {clinic_name}. "
                    "Be helpful, friendly, and concise (2-3 sentences). "
                    "No markdown, no special characters."
                ),
            )
    except Exception as e:
        logger.error(f"gather webhook error: {e}", exc_info=True)
        ai_reply = "I'm sorry, I had a brief issue. How can I help you today?"

    # Save the updated call state to the DB (like conversation history)
    try:
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to commit db state: {e}")

    # XML-escape the reply so special chars don't break TwiML
    should_hangup = "[HANGUP]" in ai_reply
    ai_reply = ai_reply.replace("[HANGUP]", "").strip()
    safe_reply = saxutils.escape(ai_reply)

    if should_hangup:
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">{safe_reply}</Say>
</Response>"""
    else:
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="10" speechTimeout="auto"
            action="{gather_url}" method="POST"
            language="en-US">
        <Say voice="alice">{safe_reply}</Say>
    </Gather>
    <Say voice="alice">Thank you for calling. Have a wonderful day! Goodbye!</Say>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


# ─── REST: Manual AI Qualify (Dev/Test Mode) ──────────────────────────────────

@router.post("/{call_id}/ai-qualify", response_model=CallResponse)
async def ai_qualify_call(
    call_id: str,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually triggers AI qualification on a call record.
    Uses mock speech input in dev mode, real Gemini when API key is set.
    Great for testing the full AI flow without an actual Twilio call.
    """
    import uuid as _uuid
    stmt = select(Call).where(Call.id == _uuid.UUID(call_id))
    result = await db.execute(stmt)
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    # Get clinic name
    client_stmt = select(Client).where(Client.id == ctx.client_id)
    client_result = await db.execute(client_stmt)
    client = client_result.scalar_one_or_none()
    clinic_name = client.clinic_name if client else "your clinic"

    # Use mock speech to trigger AI
    mock_speeches = [
        "Hi yes I was calling about getting a crown done, I've been having some pain",
        "I need to schedule a cleaning, it's been a while",
        "I'm calling about whitening, can you tell me the options and prices?",
        "I had a filling come out yesterday, it's pretty urgent",
    ]
    import random
    mock_speech = random.choice(mock_speeches)

    qualification = await ai_service.qualify_patient_speech(
        patient_speech=mock_speech,
        clinic_name=clinic_name,
        context=call.notes or "",
    )

    # Build and save structured notes
    ai_notes = f"[AI Qualified] Intent: {qualification.intent.replace('_', ' ').title()}\n"
    ai_notes += f"Treatment: {qualification.treatment_type or 'Not specified'}\n"
    if qualification.revenue_estimate:
        ai_notes += f"Revenue Estimate: ${qualification.revenue_estimate:,.0f}\n"
    ai_notes += f"\nSummary: {qualification.summary}\n"
    ai_notes += f"\nSimulated patient said: \"{mock_speech}\""

    call.notes = ai_notes
    if qualification.revenue_estimate:
        call.revenue_estimate = qualification.revenue_estimate
    await db.commit()
    await db.refresh(call)

    # Update status
    if qualification.should_recover and call.status != CallStatus.RECOVERED:
        call = await call_service.update_call_status(
            call_id=call_id,
            new_status=CallStatus.RECOVERED,
            db=db,
            client_id=str(ctx.client_id),
        )

    logger.info(
        "AI qualification complete (manual)",
        call_id=call_id,
        intent=qualification.intent,
        gemini_mode=settings.gemini_enabled,
    )
    return call_service._serialize_call(call)


# ─── REST: Send SMS ──────────────────────────────────────────────────────────

@router.post("/sms/send")
async def send_sms(
    payload: SmsRequest,
    ctx: TenantContext = Depends(require_tenant),
):
    """Manually send an SMS to a patient (or mock it in dev mode)."""
    success = await twilio_service.send_sms(
        to_number=payload.to_number,
        message=payload.message,
    )
    return {"success": success, "to": payload.to_number}


# ─── REST: Twilio Status ──────────────────────────────────────────────────────

@router.get("/twilio/status")
async def get_twilio_status(ctx: TenantContext = Depends(require_tenant)):
    """Returns whether Twilio credentials are configured for this deployment."""
    return {
        "twilio_enabled": settings.twilio_enabled,
        "phone_number": settings.TWILIO_PHONE_NUMBER if settings.twilio_enabled else None,
        "mode": "live" if settings.twilio_enabled else "mock",
        "studio_flow_enabled": settings.studio_flow_enabled,
        "flow_sid": settings.TWILIO_FLOW_SID if settings.studio_flow_enabled else None,
        "call_method": "studio_flow" if settings.studio_flow_enabled else ("twilio_raw" if settings.twilio_enabled else "mock"),
        "webhook_base_url": settings.WEBHOOK_BASE_URL or "⚠️ Not configured (set WEBHOOK_BASE_URL in .env)",
        "inbound_webhook_url": settings.inbound_webhook_url,
        "status_callback_url": settings.status_callback_url,
    }


@router.get("/ai/status")
async def get_ai_status(ctx: TenantContext = Depends(require_tenant)):
    """Returns whether Gemini AI is configured for this deployment."""
    return {
        "gemini_enabled": settings.gemini_enabled,
        "mode": "live" if settings.gemini_enabled else "mock",
    }


class VerifyCredentialsRequest(BaseModel):
    account_sid: str
    auth_token: str


@router.post("/twilio/verify")
async def verify_twilio_credentials(
    payload: VerifyCredentialsRequest,
    ctx: TenantContext = Depends(require_tenant),
):
    """
    Tests whether the provided Twilio credentials are valid.
    Does NOT store them — environment variables are used for actual secrets.
    """
    valid = await twilio_service.test_credentials(
        account_sid=payload.account_sid,
        auth_token=payload.auth_token,
    )
    return {"valid": valid}


# ─── WebSocket: Live Feed ─────────────────────────────────────────────────────

@router.websocket("/live")
async def calls_websocket(
    websocket: WebSocket,
    token: Optional[str] = None,
    client_id: Optional[str] = None,
):
    """WebSocket for real-time call updates. Connect with ?client_id=<uuid>"""
    if not client_id:
        await websocket.close(code=4001, reason="client_id required")
        return

    await manager.connect(websocket, client_id)

    try:
        await websocket.send_text(json.dumps({
            "event": "connected",
            "message": "Connected to RevFlow AI live call feed",
            "client_id": client_id,
        }))

        while True:
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"event": "pong"}))

    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)

# ─── WebSocket: Twilio Media Streams -> Gemini Multimodal Live ────────────────

@router.websocket("/media-stream")
async def twilio_media_stream(
    websocket: WebSocket,
    client_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Accepts Twilio Media Streams audio and bridges it to the Gemini Live API.
    """
    if not client_id:
        logger.error("media-stream connection missing client_id")
        await websocket.close(code=4001, reason="client_id required")
        return

    await websocket.accept()
    logger.info(f"Twilio Media Stream connected for client {client_id}")

    try:
        await handle_media_stream(websocket, client_id, db)
    except Exception as e:
        logger.error(f"Media stream error: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass
