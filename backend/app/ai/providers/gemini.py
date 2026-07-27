"""
Gemini AI Provider — Uses REST API directly via httpx (no SDK required).
Falls back to intelligent mock responses when GEMINI_API_KEY is not set.
"""
from __future__ import annotations
import json
import math
import structlog
from typing import Optional, AsyncIterator
import httpx

from app.core.config import settings

logger = structlog.get_logger()

# Gemini REST API base URL
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_CHAT_MODEL = "gemini-1.5-flash"
GEMINI_EMBED_MODEL = "text-embedding-004"


class GeminiProvider:
    """
    Async Gemini provider using httpx.
    - generate(): Standard content generation
    - embed(): Text embedding generation (returns 768-dim vector)
    - Mock mode when no API key configured
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.enabled = bool(self.api_key)
        if not self.enabled:
            logger.warning("Gemini API key not configured — using mock responses")

    async def generate(
        self,
        system_prompt: str,
        user_message: str,
        history: Optional[list] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """Generate a response from Gemini given system prompt and user message."""
        if not self.enabled:
            return self._mock_response(user_message)

        contents = []

        # Add conversation history
        if history:
            for msg in history[-10:]:  # Last 10 messages for context
                role = "user" if msg.get("role") == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": msg["content"]}]
                })

        # Add current user message
        contents.append({
            "role": "user",
            "parts": [{"text": user_message}]
        })

        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "topP": 0.8,
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
        }

        url = f"{GEMINI_BASE}/models/{GEMINI_CHAT_MODEL}:generateContent?key={self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")

            logger.warning("Gemini returned empty response", data=data)
            return self._mock_response(user_message)

        except httpx.HTTPStatusError as e:
            logger.error("Gemini API HTTP error", status=e.response.status_code, body=e.response.text[:500])
            return self._mock_response(user_message)
        except Exception as e:
            logger.error("Gemini API error", error=str(e))
            return self._mock_response(user_message)

    async def embed(self, text: str) -> list[float]:
        """Generate a text embedding vector (768 dimensions)."""
        if not self.enabled:
            return self._mock_embedding(text)

        payload = {
            "content": {"parts": [{"text": text[:8000]}]},  # Truncate to avoid token limit
            "taskType": "RETRIEVAL_DOCUMENT",
        }

        url = f"{GEMINI_BASE}/models/{GEMINI_EMBED_MODEL}:embedContent?key={self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

            return data.get("embedding", {}).get("values", self._mock_embedding(text))

        except Exception as e:
            logger.error("Gemini embed error", error=str(e))
            return self._mock_embedding(text)

    async def generate_json(
        self,
        system_prompt: str,
        user_message: str,
    ) -> dict:
        """Generate a JSON response from Gemini."""
        json_system = system_prompt + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation."
        raw = await self.generate(json_system, user_message, temperature=0.3, max_tokens=512)

        # Extract JSON from response
        raw = raw.strip()
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1])

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Failed to parse Gemini JSON response", raw=raw[:200])
            return {}

    def _mock_response(self, user_message: str) -> str:
        """Intelligent mock responses for development without API key."""
        user_lower = user_message.lower()
        if any(w in user_lower for w in ["appointment", "book", "schedule", "visit"]):
            return (
                "I'd be happy to help you schedule an appointment! "
                "Could you please let me know your preferred date and time, "
                "and the type of treatment you're looking for?"
            )
        elif any(w in user_lower for w in ["price", "cost", "how much", "fee"]):
            return (
                "Our pricing varies depending on the treatment. "
                "For a cleaning, it typically starts at $150. "
                "I'd recommend speaking with our front desk for an exact quote. "
                "Would you like to schedule a consultation?"
            )
        elif any(w in user_lower for w in ["insurance", "cover", "plan"]):
            return (
                "We accept most major insurance plans including Delta Dental, MetLife, and Cigna. "
                "Could you let me know which insurance you have so I can verify your coverage?"
            )
        elif any(w in user_lower for w in ["emergency", "pain", "urgent", "hurt"]):
            return (
                "I understand you're experiencing discomfort. "
                "We treat dental emergencies as a priority. "
                "Please call our emergency line immediately or visit us directly. "
                "Can I get your name and callback number?"
            )
        elif any(w in user_lower for w in ["hello", "hi", "hey", "good morning", "good afternoon"]):
            return (
                "Hello! Thank you for calling. I'm Aria, your AI dental receptionist. "
                "How can I assist you today?"
            )
        else:
            return (
                "Thank you for reaching out! I'm here to help with appointments, "
                "pricing, and general questions about our services. "
                "What can I assist you with today?"
            )

    def _mock_embedding(self, text: str) -> list[float]:
        """Generate a deterministic pseudo-embedding for testing."""
        # Simple character-frequency based mock embedding (768 dimensions)
        vector = [0.0] * 768
        for i, char in enumerate(text[:768]):
            vector[i % 768] += ord(char) / 1000.0
        # Normalize
        magnitude = math.sqrt(sum(v * v for v in vector)) or 1.0
        return [v / magnitude for v in vector]


# Singleton instance
gemini = GeminiProvider()
