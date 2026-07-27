"""
Conversation Memory — Manages conversation history and context.
Stores in Redis (fast) with PostgreSQL backup.
"""
from __future__ import annotations
import json
from typing import List, Optional
import structlog

logger = structlog.get_logger()


def build_history_for_gemini(messages: List[dict]) -> List[dict]:
    """
    Convert stored messages to Gemini conversation history format.
    Only use last 10 messages for context window efficiency.
    """
    history = []
    for msg in messages[-10:]:
        role = msg.get("role", "user")
        if role in ("user", "assistant"):
            history.append({
                "role": role,
                "content": msg.get("content", ""),
            })
    return history


def summarize_conversation(messages: List[dict]) -> str:
    """Create a brief summary of the conversation for memory context."""
    if not messages:
        return ""

    summary_parts = []
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "user":
            summary_parts.append(f"Patient: {content[:100]}")
        elif role == "assistant":
            summary_parts.append(f"AI: {content[:100]}")

    return "\n".join(summary_parts[-6:])  # Last 3 exchanges


class ConversationMemory:
    """In-memory conversation context store."""

    def __init__(self):
        self._sessions: dict = {}

    def store_session_context(self, session_id: str, data: dict) -> None:
        """Store session context data."""
        self._sessions[session_id] = data

    def get_session_context(self, session_id: str) -> Optional[dict]:
        """Retrieve session context data."""
        return self._sessions.get(session_id)

    def update_patient_info(self, session_id: str, **kwargs) -> None:
        """Update patient information in session context."""
        if session_id not in self._sessions:
            self._sessions[session_id] = {}
        self._sessions[session_id].update(kwargs)

    def clear_session(self, session_id: str) -> None:
        """Clear session context (called on completion)."""
        self._sessions.pop(session_id, None)


# Singleton instance
memory = ConversationMemory()
