"""
Lead Extractor — Extracts structured lead data from conversation messages.
Uses Gemini to parse patient information from natural language.
"""
from __future__ import annotations
from typing import Optional
import structlog

from app.ai.providers.gemini import gemini

logger = structlog.get_logger()


async def extract_lead_data(conversation_text: str) -> dict:
    """
    Extract structured lead information from a conversation.
    
    Returns:
        dict with keys: name, phone, email, procedure, preferred_date, insurance, urgency
    """
    if not conversation_text or len(conversation_text.strip()) < 10:
        return {}

    system = """You are a data extraction assistant for a dental clinic.
Extract patient lead information from the conversation transcript.

Return ONLY this JSON format (use null for missing fields):
{
    "name": "Full Name or null",
    "phone": "Phone number or null",
    "email": "Email address or null",
    "procedure": "Requested treatment/procedure or null",
    "preferred_date": "Preferred date/time or null",
    "insurance": "Insurance provider or null",
    "urgency": "emergency|urgent|normal|low"
}

Rules:
- Extract only information explicitly mentioned
- urgency = emergency if they mention pain/emergency
- urgency = urgent if they want an appointment within 24-48 hours
- urgency = normal for standard scheduling
"""

    result = await gemini.generate_json(system, f"Conversation:\n{conversation_text}")

    # Sanitize the result
    return {
        "name": result.get("name"),
        "phone": result.get("phone"),
        "email": result.get("email"),
        "procedure": result.get("procedure"),
        "preferred_date": result.get("preferred_date"),
        "insurance": result.get("insurance"),
        "urgency": result.get("urgency", "normal"),
    }


async def extract_patient_info_from_message(message: str) -> dict:
    """Quick extraction from a single message (for real-time updates)."""
    if not message:
        return {}

    # Quick regex-based extraction for common patterns
    import re
    result = {}

    # Phone number patterns
    phone_match = re.search(
        r"(\+?1?\s*[-.]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})", message
    )
    if phone_match:
        result["phone"] = phone_match.group(1).strip()

    # Email patterns
    email_match = re.search(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", message
    )
    if email_match:
        result["email"] = email_match.group(0)

    return result
