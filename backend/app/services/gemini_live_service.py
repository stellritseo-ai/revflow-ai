"""
Gemini Live Service — handles real-time voice calls via Twilio <Gather> + Gemini REST.

Architecture:
  1. Twilio calls /webhook/inbound  → we return TwiML with <Gather> (speech recognition)
  2. Patient speaks → Twilio POSTs transcript to /webhook/gather
  3. We send the text to Gemini REST API and get a reply
  4. We return TwiML with <Say> to speak the reply + another <Gather> for the next turn

This is the most reliable approach — no WebSockets, no streaming, just HTTP.
"""
import structlog
import httpx
import json
from fastapi import WebSocket, WebSocketDisconnect

from app.core.config import settings

logger = structlog.get_logger()


async def get_gemini_text_response(user_text: str, system_prompt: str) -> str:
    """
    Calls Gemini REST API (generateContent) and returns the text reply.
    Falls back to a polite message if Gemini is unavailable.
    """
    if not settings.gemini_enabled:
        return "I'm sorry, our AI assistant is currently unavailable. Please hold while we connect you to a team member."

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"

    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_text}]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 200,
            "temperature": 0.7
        }
    }

    headers = {
        "x-goog-api-key": settings.GEMINI_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            # Clean up the text for TTS — remove markdown symbols
            text = text.replace("**", "").replace("*", "").replace("#", "").strip()
            return text
    except Exception as e:
        logger.error(f"Gemini REST API call failed: {e}")
        return "Thank you for calling. Our team will be with you shortly. How can I help you today?"


async def handle_media_stream(twilio_ws: WebSocket, client_id: str, db):
    """
    Legacy WebSocket handler — kept for compatibility.
    The main AI flow now uses the Gather webhook approach in calls.py.
    We simply close this gracefully if called.
    """
    try:
        await twilio_ws.close()
    except Exception:
        pass
