"""
Intent Classifier — Detects patient intent from conversation messages.
Uses Gemini for classification with a structured prompt, with pattern fallback.
"""
from __future__ import annotations
import re
from typing import Tuple
import structlog

from app.ai.providers.gemini import gemini
from app.ai.models import IntentType

logger = structlog.get_logger()

# Keyword-based fallback patterns
INTENT_PATTERNS = {
    IntentType.EMERGENCY: [
        r"\bemergency\b", r"\bpain\b", r"\bhurting\b", r"\bsevere\b",
        r"\bswollen\b", r"\bbleeding\b", r"\bcracked\b", r"\burgent\b",
    ],
    IntentType.APPOINTMENT: [
        r"\bappointment\b", r"\bbook\b", r"\bschedule\b", r"\bvisit\b",
        r"\bsee a doctor\b", r"\bcome in\b", r"\bnext available\b",
    ],
    IntentType.PRICING: [
        r"\bprice\b", r"\bcost\b", r"\bhow much\b", r"\bfee\b",
        r"\bcharge\b", r"\bafford\b", r"\bexpensive\b",
    ],
    IntentType.INSURANCE: [
        r"\binsurance\b", r"\bcover\b", r"\bplan\b", r"\bbenefits\b",
        r"\bdeductible\b", r"\bcopay\b", r"\bin-network\b",
    ],
    IntentType.CANCELLATION: [
        r"\bcancel\b", r"\bcancellation\b", r"\bneed to cancel\b",
        r"\bcan't make it\b", r"\bcannot make\b",
    ],
    IntentType.RESCHEDULE: [
        r"\breschedule\b", r"\bchange my appointment\b", r"\bmove my appointment\b",
        r"\bdifferent time\b", r"\bdifferent day\b",
    ],
    IntentType.HUMAN_REQUEST: [
        r"\bspeak to\b", r"\btalk to\b", r"\bhuman\b", r"\breal person\b",
        r"\boperator\b", r"\bstaff\b", r"\bsomeone\b",
    ],
    IntentType.COMPLAINT: [
        r"\bcomplaint\b", r"\bnot happy\b", r"\bdissatisfied\b",
        r"\bbad experience\b", r"\bunprofessional\b", r"\bwrong\b",
    ],
    IntentType.FOLLOW_UP: [
        r"\bfollow.?up\b", r"\bafter my\b", r"\bhow is\b", r"\bresults?\b",
        r"\bpost.?op\b", r"\bafter treatment\b",
    ],
}


def classify_intent_by_pattern(text: str) -> Tuple[IntentType, float]:
    """Fast pattern-based intent classification as fallback."""
    text_lower = text.lower()
    best_intent = IntentType.GENERAL_QUESTION
    best_score = 0.0

    for intent, patterns in INTENT_PATTERNS.items():
        matches = sum(1 for p in patterns if re.search(p, text_lower))
        score = matches / len(patterns)
        if score > best_score:
            best_score = score
            best_intent = intent

    return best_intent, min(best_score * 3, 1.0)  # Scale up


async def classify_intent(
    user_message: str,
    conversation_context: str = "",
) -> Tuple[str, float]:
    """
    Classify patient intent from a message.
    Uses Gemini for accuracy; falls back to pattern matching.
    
    Returns: (intent_name, confidence_score)
    """
    if not user_message or not user_message.strip():
        return IntentType.UNKNOWN, 0.0

    intents_list = ", ".join([i.value for i in IntentType])
    system = f"""You are an intent classifier for a dental clinic AI receptionist.
Classify the patient's message into exactly ONE of these intents: {intents_list}

Respond with ONLY this JSON format:
{{"intent": "appointment", "confidence": 0.95}}
"""
    user = f"Patient message: {user_message}"
    if conversation_context:
        user += f"\n\nConversation context: {conversation_context}"

    result = await gemini.generate_json(system, user)

    intent_str = result.get("intent", "")
    confidence = float(result.get("confidence", 0.0))

    # Validate intent
    try:
        intent = IntentType(intent_str)
        return intent.value, confidence
    except ValueError:
        # Fall back to pattern matching
        intent, conf = classify_intent_by_pattern(user_message)
        return intent.value, conf
