"""
Conversation State Machine — Manages conversation state transitions.
States: greeting → qualification → information → booking → confirmation → escalation/completed
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.models import (
    ConversationSession,
    ConversationState,
    ConversationStateRecord,
    ConversationRole,
    ConversationMessage,
)

logger = structlog.get_logger()

# State transition rules: {current_state: [allowed_next_states]}
VALID_TRANSITIONS = {
    ConversationState.GREETING: [
        ConversationState.QUALIFICATION,
        ConversationState.INFORMATION,
        ConversationState.ESCALATION,
    ],
    ConversationState.QUALIFICATION: [
        ConversationState.INFORMATION,
        ConversationState.BOOKING,
        ConversationState.ESCALATION,
    ],
    ConversationState.INFORMATION: [
        ConversationState.BOOKING,
        ConversationState.QUALIFICATION,
        ConversationState.ESCALATION,
        ConversationState.FOLLOW_UP,
    ],
    ConversationState.BOOKING: [
        ConversationState.CONFIRMATION,
        ConversationState.ESCALATION,
    ],
    ConversationState.CONFIRMATION: [
        ConversationState.COMPLETED,
        ConversationState.FOLLOW_UP,
    ],
    ConversationState.FOLLOW_UP: [
        ConversationState.COMPLETED,
        ConversationState.BOOKING,
    ],
    ConversationState.ESCALATION: [
        ConversationState.COMPLETED,
    ],
    ConversationState.COMPLETED: [],  # Terminal state
}


def determine_next_state(
    current_state: ConversationState,
    intent: str,
    ai_response: str,
) -> Optional[ConversationState]:
    """Determine the next state based on detected intent and current state."""
    intent_lower = intent.lower()
    response_lower = ai_response.lower()

    # Emergency / human request → immediate escalation
    if intent_lower in ("emergency", "human_request", "complaint"):
        if current_state != ConversationState.ESCALATION:
            return ConversationState.ESCALATION

    # Intent-based transitions
    if current_state == ConversationState.GREETING:
        if intent_lower in ("appointment", "booking", "reschedule", "cancellation"):
            return ConversationState.QUALIFICATION
        return ConversationState.INFORMATION

    if current_state == ConversationState.QUALIFICATION:
        if intent_lower in ("appointment",) or any(
            kw in response_lower for kw in ["let me check availability", "i can book", "schedule you"]
        ):
            return ConversationState.BOOKING
        return ConversationState.INFORMATION

    if current_state == ConversationState.INFORMATION:
        if intent_lower == "appointment" or any(
            kw in response_lower for kw in ["would you like to book", "schedule an appointment"]
        ):
            return ConversationState.BOOKING
        return None  # Stay in current state

    if current_state == ConversationState.BOOKING:
        if any(kw in response_lower for kw in ["confirmed", "booked", "appointment is set", "see you"]):
            return ConversationState.CONFIRMATION

    if current_state == ConversationState.CONFIRMATION:
        return ConversationState.COMPLETED

    return None  # No transition


async def transition_state(
    session: ConversationSession,
    new_state: ConversationState,
    trigger: str,
    db: AsyncSession,
) -> None:
    """Apply a state transition and record it."""
    allowed = VALID_TRANSITIONS.get(session.current_state, [])
    if new_state not in allowed:
        logger.warning(
            "Invalid state transition",
            from_state=session.current_state,
            to_state=new_state,
        )
        return

    record = ConversationStateRecord(
        session_id=session.id,
        from_state=session.current_state.value,
        to_state=new_state.value,
        trigger=trigger,
        transitioned_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(record)
    session.current_state = new_state
    logger.info("State transition", from_state=record.from_state, to_state=new_state.value)


async def add_message(
    session: ConversationSession,
    role: ConversationRole,
    content: str,
    db: AsyncSession,
    detected_intent: Optional[str] = None,
    rag_chunks_used: Optional[list] = None,
    tokens_used: int = 0,
) -> ConversationMessage:
    """Add a message to the conversation session."""
    message = ConversationMessage(
        session_id=session.id,
        client_id=session.client_id,
        role=role,
        content=content,
        detected_intent=detected_intent,
        rag_chunks_used={"chunks": rag_chunks_used} if rag_chunks_used else None,
        tokens_used=tokens_used,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(message)
    session.total_messages += 1
    return message
