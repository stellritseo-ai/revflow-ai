"""
AI Conversation Engine — powered by Google Gemini.

In dev mode (no GEMINI_API_KEY), returns deterministic mock responses
so the full qualification flow is testable without any API key.

Set GEMINI_API_KEY in .env to activate real AI conversations.
Get a free key at: https://aistudio.google.com
"""
import json
import random
import httpx
import structlog
from dataclasses import dataclass
from typing import Optional

from app.core.config import settings

logger = structlog.get_logger()

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# ─── Data Model ───────────────────────────────────────────────────────────────

@dataclass
class QualificationResult:
    intent: str                        # wants_appointment | has_questions | not_interested | wrong_number
    ai_response: str                   # what to speak back to the patient
    summary: str                       # structured notes to store on the Call record
    treatment_type: Optional[str]      # extracted treatment, e.g. "Crown", "Cleaning"
    revenue_estimate: Optional[float]  # estimated billing value
    should_recover: bool               # True if call should be marked Recovered


# ─── Mock Responses ───────────────────────────────────────────────────────────

MOCK_OUTCOMES = [
    QualificationResult(
        intent="wants_appointment",
        ai_response="Excellent! We'd love to help you schedule that. Our next available slot is tomorrow at 2 PM. Would that work for you?",
        summary="Patient confirmed interest in scheduling an appointment. Expressed urgency — mentioned tooth pain. Suggested crown or filling evaluation. High likelihood of booking.",
        treatment_type="Crown",
        revenue_estimate=1200.0,
        should_recover=True,
    ),
    QualificationResult(
        intent="wants_appointment",
        ai_response="Of course! We have openings this week for a cleaning and checkup. Shall I note your interest and have our team confirm the exact time?",
        summary="Patient interested in routine cleaning and annual checkup. Long-time patient, mentioned it's been 18 months. Likely to book hygiene appointment.",
        treatment_type="Cleaning & Checkup",
        revenue_estimate=280.0,
        should_recover=True,
    ),
    QualificationResult(
        intent="wants_appointment",
        ai_response="I understand! Teeth whitening is very popular. Our team can walk you through both in-office and take-home options. I'll flag this for our cosmetic coordinator.",
        summary="Patient inquiring about cosmetic whitening services. Comparing options. Warm lead — requested follow-up with treatment coordinator.",
        treatment_type="Teeth Whitening",
        revenue_estimate=650.0,
        should_recover=True,
    ),
    QualificationResult(
        intent="has_questions",
        ai_response="That's a great question! Our team will have full details ready when they call. I've noted your question so they can address it right away.",
        summary="Patient had billing and insurance questions. Uncertain about coverage for planned procedure. Needs insurance verification before booking. Warm lead.",
        treatment_type=None,
        revenue_estimate=None,
        should_recover=False,
    ),
    QualificationResult(
        intent="not_interested",
        ai_response="No problem at all! We appreciate your time. If you ever need dental care in the future, don't hesitate to reach out. Have a wonderful day!",
        summary="Patient not interested in scheduling at this time. Mentioned they found care elsewhere. Politely declined further follow-up.",
        treatment_type=None,
        revenue_estimate=None,
        should_recover=False,
    ),
]


def _mock_qualify() -> QualificationResult:
    """Returns a weighted random mock qualification — mostly positive outcomes."""
    weights = [0.35, 0.25, 0.20, 0.15, 0.05]
    return random.choices(MOCK_OUTCOMES, weights=weights, k=1)[0]


# ─── Gemini AI ─────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an AI receptionist for a dental clinic. A patient called the clinic and missed the call.
The clinic's AI system called them back. You have received the patient's spoken response.

Analyze the patient's speech and return a JSON object with these exact fields:
{
  "intent": "wants_appointment" | "has_questions" | "not_interested" | "wrong_number",
  "ai_response": "<what to say back to the patient in 1-2 sentences, warm and professional>",
  "summary": "<2-3 sentence professional notes for the clinic staff about this patient interaction>",
  "treatment_type": "<dental treatment type mentioned, or null>",
  "revenue_estimate": <estimated dollar amount as a number, or null>,
  "should_recover": <true if patient wants to book, false otherwise>
}

Treatment revenue estimates (use these as guidelines):
- Emergency/Pain: 400-800
- Crown: 1000-1500
- Cleaning/Checkup: 200-350
- Filling: 150-400
- Whitening: 500-800
- Implant: 3000-5000
- Braces/Ortho: 4000-7000
- Root Canal: 800-1500

Be concise, professional, and empathetic. The ai_response will be spoken aloud to the patient."""


async def qualify_patient_speech(
    patient_speech: str,
    clinic_name: str = "the clinic",
    context: str = "",
) -> QualificationResult:
    """
    Uses Gemini 1.5 Flash to analyze what the patient said and return a
    structured qualification result.

    Falls back to mock output if no API key is configured.
    """
    if not settings.gemini_enabled:
        logger.info("Gemini not configured — using mock AI qualification")
        return _mock_qualify()

    prompt = f"""Clinic: {clinic_name}
Patient spoken response: "{patient_speech}"
{f'Context: {context}' if context else ''}

Analyze this and return a JSON object following the system instructions."""

    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 512,
            "responseMimeType": "application/json",
        },
    }

    try:
        # AQ. format uses Authorization Bearer; AIzaSy uses ?key= query param
        api_key = settings.GEMINI_API_KEY
        if api_key and api_key.startswith("AQ."):
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            }
            url = GEMINI_API_URL
        else:
            headers = {"Content-Type": "application/json"}
            url = f"{GEMINI_API_URL}?key={api_key}"

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        # Extract the text content from Gemini response
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw_text)

        result = QualificationResult(
            intent=parsed.get("intent", "has_questions"),
            ai_response=parsed.get("ai_response", "Thank you for your response. Our team will follow up shortly."),
            summary=parsed.get("summary", "AI qualification completed."),
            treatment_type=parsed.get("treatment_type"),
            revenue_estimate=float(parsed["revenue_estimate"]) if parsed.get("revenue_estimate") else None,
            should_recover=bool(parsed.get("should_recover", False)),
        )
        logger.info(
            "Gemini qualification complete",
            intent=result.intent,
            treatment=result.treatment_type,
            revenue=result.revenue_estimate,
        )
        return result

    except Exception as e:
        logger.error("Gemini API error — falling back to mock", error=str(e))
        return _mock_qualify()


async def generate_greeting(clinic_name: str) -> str:
    """
    Uses Gemini to generate a warm, dynamic opening greeting for the callback call.
    Falls back to a standard greeting in mock mode.
    """
    if not settings.gemini_enabled:
        return (
            f"Hello! This is an automated callback from {clinic_name}. "
            f"We noticed you tried to reach us recently and we'd love to help. "
            f"Please briefly tell us how we can assist you today."
        )

    prompt = f"""Generate a warm, professional, 2-sentence opening greeting for a dental clinic AI callback system.
The clinic is named: {clinic_name}.
The AI is calling back a patient who called the clinic but couldn't be helped.
End the greeting by asking the patient to briefly describe what they need.
Keep it under 40 words total. Do not include any formatting or quotes."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 100},
    }

    try:
        api_key = settings.GEMINI_API_KEY
        if api_key and api_key.startswith("AQ."):
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
            url = GEMINI_API_URL
        else:
            headers = {"Content-Type": "application/json"}
            url = f"{GEMINI_API_URL}?key={api_key}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logger.error("Gemini greeting generation failed", error=str(e))
        return f"Hello! This is {clinic_name} calling back. How can we help you today?"
