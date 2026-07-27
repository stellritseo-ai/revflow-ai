"""
AI Appointment Booking Service — Free-form conversation with appointment booking.

Architecture:
- Gemini handles ALL conversation (free, natural, unconstrained)
- System prompt tells Gemini to include structured booking tags when ready
- We parse those tags to trigger actual booking
- State stored as JSON in call.notes between webhook calls
"""
import json
import uuid
import structlog
import httpx
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.websocket import manager
from app.models.models import Appointment, AppointmentStatus, Client, Call, CallStatus
from app.scheduling.models import DoctorSchedule
from app.ai.models import AIProfile
from app.scheduling.services.booking_engine import book_appointment_with_engine
from app.scheduling.services.availability_engine import compute_availability

logger = structlog.get_logger()


async def get_ai_reply(
    user_text: str,
    system_prompt: str,
    conversation_history: list,
) -> str:
    """Uses Groq Llama 3 via OpenAI-compatible API"""
    if not settings.GROQ_API_KEY:
        return _fallback_reply(user_text)

    url = "https://api.groq.com/openai/v1/chat/completions"
    
    messages = [{"role": "system", "content": system_prompt}]
    for turn in conversation_history:
        # Convert Gemini roles to OpenAI roles
        role = "assistant" if turn["role"] == "model" else turn["role"]
        messages.append({"role": role, "content": turn["text"]})
    messages.append({"role": "user", "content": user_text})

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 200,
    }

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
            
            # Strip markdown for TTS
            text = (
                text.replace("**", "").replace("*", "")
                    .replace("#", "").replace("\n", " ")
                    .replace("  ", " ").strip()
            )
            return text
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        import traceback
        with open("debug_groq.log", "w") as f:
            f.write(f"Groq API error: {e}\n\nTraceback:\n")
            f.write(traceback.format_exc())
            if hasattr(e, 'response') and e.response is not None:
                f.write(f"\nResponse Body:\n{e.response.text}")
        return _fallback_reply(user_text)


def _fallback_reply(user_text: str) -> str:
    """Simple rule-based fallback when Gemini is unavailable."""
    text_lower = user_text.lower()
    if any(w in text_lower for w in ["book", "appointment", "schedule"]):
        return "I'd be happy to book an appointment for you. May I have your name and preferred date?"
    if any(w in text_lower for w in ["cleaning", "checkup", "crown", "filling", "teeth"]):
        return (
            "We offer a full range of dental services. "
            "Would you like to book an appointment for that? "
            "I can check availability right now."
        )
    if any(w in text_lower for w in ["hour", "open", "time", "when"]):
        return "We are open Monday through Friday, 9 AM to 5 PM. Would you like to schedule a visit?"
    if any(w in text_lower for w in ["price", "cost", "how much", "insurance"]):
        return "Pricing varies by treatment. I recommend calling during office hours for an exact quote, or I can book you a consultation."
    return (
        "Thank you for calling. I'm your AI receptionist and I'm here to help. "
        "I can answer questions or book an appointment for you. What can I do for you today?"
    )


def get_state(call: Call) -> dict:
    """Load conversation state from call notes."""
    try:
        raw = call.notes or ""
        # Try to find the JSON state block
        if raw.startswith("__STATE__"):
            json_str = raw[len("__STATE__"):].strip()
            return json.loads(json_str)
    except Exception:
        pass
    return {"history": [], "booking": None}


def save_state(call: Call, state: dict):
    """Persist conversation state to call notes."""
    call.notes = "__STATE__" + json.dumps(state)


async def get_available_slots(client_id: uuid.UUID, db: AsyncSession) -> list:
    """Get next available slots using the advanced scheduling engine."""
    now = datetime.now()
    date_from = now.isoformat()
    date_to = (now + timedelta(days=14)).isoformat()

    engine_slots = await compute_availability(
        client_id=str(client_id),
        db=db,
        date_from=date_from,
        date_to=date_to,
        duration_minutes=60,
    )

    slots = []
    # Take the first 3 slots for the AI to offer
    for s in engine_slots[:3]:
        # s is a dict with start_time, end_time, provider_name, slot_id
        start = datetime.fromisoformat(s["start_time"])
        t = start.strftime("%H:%M")
        date_str = start.strftime("%Y-%m-%d")
        
        slots.append({
            "slot_id": s["slot_id"],
            "date": date_str,
            "time": t,
            "provider": s["provider_name"],
            "label": f"{start.strftime('%A %B %d')} at {t} with {s['provider_name']}",
        })

    # Fallback if engine returns nothing (for demo purposes)
    if not slots:
        d = now + timedelta(days=1)
        while len(slots) < 3:
            if d.weekday() < 5:
                label = d.strftime("%A %B %d") + " at 10:00 AM"
                slots.append({
                    "slot_id": f"demo-slot-{len(slots)}",
                    "date": d.strftime("%Y-%m-%d"),
                    "time": "10:00",
                    "provider": "Dr. Smith",
                    "label": label,
                })
            d += timedelta(days=1)

    return slots


async def do_book(
    client_id: uuid.UUID,
    call: Call,
    booking_info: dict,
    db: AsyncSession,
) -> Appointment:
    """Create appointment using advanced booking engine + broadcast event."""
    
    appt = await book_appointment_with_engine(
        client_id=str(client_id),
        db=db,
        slot_id=booking_info.get("slot_id", "demo-slot-0"),
        patient_name=booking_info.get("name", "Patient"),
        patient_phone=booking_info.get("phone") or call.from_number,
        patient_email=None,
        treatment_type=booking_info.get("treatment", "Consultation"),
        provider_name=booking_info.get("provider", "Doctor"),
        scheduled_at=booking_info.get("scheduled_at", datetime.now().isoformat()),
        duration_minutes=60,
        notes=f"Booked via AI phone call. Call SID: {call.call_sid}",
        revenue_amount=None,
        call_id=str(call.id),
    )
    
    call.status = CallStatus.RECOVERED
    await db.commit()

    # Push real-time update to the clinic dashboard
    await manager.broadcast_to_tenant(str(client_id), {
        "event": "appointment_booked",
        "appointment": {
            "id": str(appt.id),
            "patient_name": appt.patient_name,
            "patient_phone": appt.patient_phone,
            "treatment_type": appt.treatment_type,
            "scheduled_at": appt.scheduled_at,
            "provider_name": appt.provider_name,
            "status": appt.status.value,
            "booked_via": "AI Phone Call",
        },
    })
    logger.info("AI booked appointment", id=str(appt.id), patient=appt.patient_name)
    return appt


async def handle_booking_conversation(
    speech: str,
    call: Call,
    client: Client,
    db: AsyncSession,
) -> str:
    """
    Main entry point. Free-form Gemini conversation that can also book appointments.
    """
    try:
        state = get_state(call)
        history = state.get("history", [])
        booking = state.get("booking", None)  # Pending booking info if any

        # Load AI profile
        profile_stmt = select(AIProfile).where(AIProfile.client_id == client.id).limit(1)
        profile = (await db.execute(profile_stmt)).scalar_one_or_none()
        ai_name = profile.ai_name if profile else "Aria"

        # Get available slots to include in context
        slots = await get_available_slots(client.id, db)
        slots_text = ", ".join([s["label"] for s in slots]) if slots else "Monday through Friday at 10 AM"

        # Build the system prompt — Gemini drives everything freely
        system_prompt = f"""You are {ai_name}, the friendly AI receptionist for {client.clinic_name}.

You are on a PHONE CALL. Rules:
- Keep replies short: 1-3 sentences max.
- Speak naturally. No markdown, no bullet points, no lists.
- You have ALREADY greeted the user. DO NOT start your response with a greeting (like "Hi, I'm Aria"). Just answer their request.

To book an appointment, you MUST know:
1) Patient Name
2) Desired Treatment (e.g. Consultation, Cleaning, Emergency Service, etc.)
3) Desired Date/Time

You ALREADY have their phone number. Do NOT ask for their phone number.

If the user wants to book, guide them through collecting this info ONE question at a time.
If it is an emergency, assure them you can help and book an Emergency Service slot immediately.

Available dates/times you can offer right now:
{slots_text}

CRITICAL INSTRUCTION: When you have the Name, Treatment, and Date, you must ask the patient to confirm the booking. Once they say YES, you MUST output this exact tag at the end of your sentence:
[BOOK: name=<name> | treatment=<treatment> | slot=<slot label>]

Example of a valid final reply:
Perfect, you are all set. [BOOK: name=John Smith | treatment=Emergency Service | slot={slots[0]['label'] if slots else 'Monday at 10 AM'}]
- For general questions about dental care, treatments, pricing, hours — answer naturally and helpfully."""

        # Get AI's reply
        reply = await get_ai_reply(speech, system_prompt, history)

        # Check if AI wants to book
        if "[BOOK:" in reply:
            # Parse the booking tag
            try:
                tag_start = reply.index("[BOOK:")
                tag_end = reply.index("]", tag_start)
                tag_content = reply[tag_start + 6:tag_end].strip()

                parts = {}
                for p in tag_content.split("|"):
                    if "=" in p:
                        k, v = p.split("=", 1)
                        parts[k.strip().lower()] = v.strip()
                    else:
                        # Fallback if AI forgets key=value format
                        pass

                name = parts.get("name", "Patient")
                treatment = parts.get("treatment", "Consultation")
                slot_label = parts.get("slot", "")

                # Match slot label to a real slot
                matched_slot = next(
                    (s for s in slots if s["label"].lower() in slot_label.lower()
                     or slot_label.lower() in s["label"].lower()),
                    slots[0] if slots else None
                )

                if matched_slot:
                    scheduled_at = f"{matched_slot['date']}T{matched_slot['time']}:00"
                    booking_info = {
                        "name": name,
                        "treatment": treatment,
                        "provider": matched_slot.get("provider", "Doctor"),
                        "scheduled_at": scheduled_at,
                        "phone": call.from_number,
                        "slot_id": matched_slot.get("slot_id"),
                    }
                    await do_book(client.id, call, booking_info, db)

                # Remove the tag from the spoken reply
                reply = reply[:tag_start].strip()
                if not reply:
                    reply = "Your booking is complete, thank you for calling, have a good day."
                else:
                    reply = "Your booking is complete, thank you for calling, have a good day."
                
                # Signal the webhook to hang up
                reply += " [HANGUP]"

            except Exception as e:
                logger.error(f"Failed to parse booking tag: {e}")
                import traceback
                with open("debug_parse.log", "w") as f:
                    f.write(f"Parser failed on reply: {reply}\nException: {e}\nTraceback:\n{traceback.format_exc()}")
                # Continue without booking — the conversation still works

        # Save updated history
        history.append({"role": "user", "text": speech})
        history.append({"role": "model", "text": reply})
        state["history"] = history[-12:]  # Keep last 6 turns

        save_state(call, state)

        try:
            await db.commit()
        except Exception:
            await db.rollback()

        return reply

    except Exception as e:
        logger.error(f"handle_booking_conversation error: {e}", exc_info=True)
        import traceback
        with open("debug_error.log", "w") as f:
            f.write(traceback.format_exc())
        return "I'm sorry, I had a brief issue. How can I help you today?"
