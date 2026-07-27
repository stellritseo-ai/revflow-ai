"""
Dynamic Prompt Builder — Constructs a full system prompt from clinic context.
Every component is injected dynamically — nothing is hardcoded.
"""
from __future__ import annotations
from typing import Optional, List
from app.ai.models import AIProfile, VoiceProfile, PersonalityStyle, ResponseLength


PERSONALITY_DESCRIPTIONS = {
    PersonalityStyle.PROFESSIONAL: (
        "You are professional, precise, and efficient. "
        "Use formal language and focus on providing accurate information quickly."
    ),
    PersonalityStyle.FRIENDLY: (
        "You are warm, approachable, and conversational. "
        "Use friendly language and make patients feel comfortable and welcome."
    ),
    PersonalityStyle.WARM: (
        "You are caring, empathetic, and supportive. "
        "Show genuine interest in the patient's wellbeing and speak with compassion."
    ),
    PersonalityStyle.PREMIUM: (
        "You represent a luxury dental practice. "
        "Be elegant, sophisticated, and attentive. Every interaction should feel exclusive."
    ),
    PersonalityStyle.EMPATHETIC: (
        "You are deeply empathetic and patient. "
        "Acknowledge the patient's feelings and concerns before providing information."
    ),
}

RESPONSE_LENGTH_INSTRUCTIONS = {
    ResponseLength.BRIEF: "Keep all responses under 2 sentences. Be concise and direct.",
    ResponseLength.STANDARD: "Keep responses to 2-4 sentences. Be informative but concise.",
    ResponseLength.DETAILED: "Provide thorough, detailed responses. Explain context when helpful.",
}


def build_system_prompt(
    ai_profile: AIProfile,
    clinic_name: str,
    clinic_address: Optional[str] = None,
    clinic_phone: Optional[str] = None,
    business_hours: Optional[str] = None,
    doctors: Optional[List[str]] = None,
    services: Optional[List[str]] = None,
    insurance_info: Optional[str] = None,
    rag_context: Optional[str] = None,
    conversation_memory: Optional[str] = None,
) -> str:
    """
    Build a complete, dynamic system prompt for the AI receptionist.
    All context is injected from the clinic's actual configuration.
    """
    sections = []

    # ── 1. Identity & Role ──────────────────────────────────────────────────
    sections.append(f"""## AI Receptionist Identity
You are {ai_profile.ai_name}, the AI receptionist for {clinic_name}.
Your receptionist name is {ai_profile.receptionist_name}.

{PERSONALITY_DESCRIPTIONS.get(ai_profile.personality, PERSONALITY_DESCRIPTIONS[PersonalityStyle.PROFESSIONAL])}

{RESPONSE_LENGTH_INSTRUCTIONS.get(ai_profile.response_length, RESPONSE_LENGTH_INSTRUCTIONS[ResponseLength.STANDARD])}
""")

    # ── 2. Clinic Information ───────────────────────────────────────────────
    clinic_section = f"## About {clinic_name}\n"
    clinic_section += f"Clinic Name: {clinic_name}\n"
    if clinic_address:
        clinic_section += f"Address: {clinic_address}\n"
    if clinic_phone:
        clinic_section += f"Phone: {clinic_phone}\n"
    if business_hours:
        clinic_section += f"Business Hours:\n{business_hours}\n"
    sections.append(clinic_section)

    # ── 3. Greeting ─────────────────────────────────────────────────────────
    if ai_profile.greeting_message:
        sections.append(f"## Standard Greeting\nWhen a patient first contacts us, use this greeting:\n{ai_profile.greeting_message}")

    # ── 4. Medical Team ─────────────────────────────────────────────────────
    if doctors:
        sections.append(f"## Our Doctors\n" + "\n".join(f"- {d}" for d in doctors))

    # ── 5. Services ─────────────────────────────────────────────────────────
    if services:
        sections.append(f"## Services We Offer\n" + "\n".join(f"- {s}" for s in services))

    # ── 6. Insurance ────────────────────────────────────────────────────────
    if insurance_info:
        sections.append(f"## Insurance Information\n{insurance_info}")
    elif ai_profile.insurance_rules:
        sections.append(f"## Insurance Rules\n{ai_profile.insurance_rules}")

    # ── 7. Business Rules ───────────────────────────────────────────────────
    if ai_profile.business_rules:
        sections.append(f"## Business Rules\n{ai_profile.business_rules}")

    if ai_profile.booking_rules:
        sections.append(f"## Booking Rules\n{ai_profile.booking_rules}")

    if ai_profile.appointment_rules:
        sections.append(f"## Appointment Rules\n{ai_profile.appointment_rules}")

    # ── 8. Emergency & Escalation ───────────────────────────────────────────
    emergency_section = "## Emergency & Escalation Protocols\n"
    if ai_profile.emergency_rules:
        emergency_section += f"Emergency: {ai_profile.emergency_rules}\n"
    else:
        emergency_section += "For dental emergencies, always connect the patient to a human staff member immediately.\n"
    if ai_profile.escalation_rules:
        emergency_section += f"Escalation: {ai_profile.escalation_rules}\n"
    else:
        emergency_section += "If the patient explicitly asks to speak to a human, escalate immediately.\n"
    sections.append(emergency_section)

    # ── 9. Custom Instructions ──────────────────────────────────────────────
    if ai_profile.custom_instructions:
        sections.append(f"## Special Instructions\n{ai_profile.custom_instructions}")

    # ── 10. Conversation Memory ─────────────────────────────────────────────
    if conversation_memory:
        sections.append(f"## Conversation Context\n{conversation_memory}")

    # ── 11. Knowledge Base Context (RAG) ────────────────────────────────────
    if rag_context:
        sections.append(rag_context)

    # ── 12. Core Constraints ────────────────────────────────────────────────
    sections.append("""## Core Rules (Always Follow)
- NEVER reveal that you are an AI unless directly and explicitly asked.
- NEVER make up information. If you don't know something, say so and offer to transfer to staff.
- NEVER discuss competitor clinics.
- NEVER provide medical diagnoses or treatment recommendations.
- ALWAYS collect patient name and phone number before ending a conversation.
- ALWAYS stay focused on the clinic's services.
- If uncertain about any specific detail (pricing, availability), say you'll have a human confirm.
- Respond only in the language the patient is speaking.
""")

    return "\n\n".join(sections)


def build_memory_summary(session_data: dict) -> str:
    """Build a conversation memory summary string from session data."""
    if not session_data:
        return ""

    lines = ["## What We Know About This Patient"]

    if session_data.get("patient_name"):
        lines.append(f"Patient Name: {session_data['patient_name']}")
    if session_data.get("patient_phone"):
        lines.append(f"Phone: {session_data['patient_phone']}")
    if session_data.get("patient_email"):
        lines.append(f"Email: {session_data['patient_email']}")
    if session_data.get("patient_insurance"):
        lines.append(f"Insurance: {session_data['patient_insurance']}")
    if session_data.get("summary"):
        lines.append(f"Previous Summary: {session_data['summary']}")

    return "\n".join(lines) if len(lines) > 1 else ""
