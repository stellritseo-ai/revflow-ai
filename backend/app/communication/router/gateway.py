"""
Communication Gateway — Unified Router
Receives all messages (Voice, SMS, Email, Chat) and routes them through the AI Engine.
"""
import uuid
import structlog
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.communication.models import (
    ConversationThread,
    InteractionMessage,
    ChannelType,
    ThreadStatus,
)
from app.ai.models import ConversationSession, ConversationState
from app.ai.gateway.gateway import process_ai_message
from app.models.models import Client

logger = structlog.get_logger()


async def handle_incoming_message(
    client_id: str,
    channel_type: ChannelType,
    sender_id: str,  # e.g., phone number, email
    message_content: str,
    db: AsyncSession,
) -> dict:
    """
    Core entrypoint for ALL incoming communication.
    1. Identify Patient
    2. Find or create Thread & AI Session
    3. Save incoming message
    4. Run AI Engine (if not assigned to human)
    5. Save AI response
    6. Return response to provider
    """
    
    # 1. Identify Patient (mock lookup for now based on sender_id)
    # In a real system, we'd query Patient.phone == sender_id or email
    patient_phone = sender_id
    
    # 2. Find Active Thread
    result = await db.execute(
        select(ConversationThread).where(
            ConversationThread.client_id == client_id,
            ConversationThread.status == ThreadStatus.ACTIVE,
            # For this demo, we'll assume one active thread per sender/patient
            # Realistically we'd map via the InteractionMessage sender_id history
        ).order_by(ConversationThread.created_at.desc()).limit(1)
    )
    thread = result.scalar_one_or_none()

    if not thread:
        # Create AI Session
        ai_session = ConversationSession(
            client_id=client_id,
            current_state=ConversationState.GREETING,
            patient_phone=sender_id if channel_type in (ChannelType.VOICE, ChannelType.SMS) else None,
            patient_email=sender_id if channel_type == ChannelType.EMAIL else None,
        )
        db.add(ai_session)
        await db.flush()

        # Create Thread
        thread = ConversationThread(
            client_id=client_id,
            patient_phone=patient_phone,
            ai_session_id=str(ai_session.id),
            primary_channel=channel_type,
            status=ThreadStatus.ACTIVE,
        )
        db.add(thread)
        await db.flush()
    else:
        # Load existing AI session
        ai_session_result = await db.execute(
            select(ConversationSession).where(ConversationSession.id == thread.ai_session_id)
        )
        ai_session = ai_session_result.scalar_one()

    # 3. Save incoming Interaction
    incoming_msg = InteractionMessage(
        client_id=client_id,
        thread_id=str(thread.id),
        channel=channel_type,
        direction="inbound",
        sender_id=sender_id,
        content=message_content,
    )
    db.add(incoming_msg)
    await db.flush()

    # 4. Check if assigned to human
    if thread.is_assigned_to_human:
        logger.info("Thread is assigned to human, skipping AI", thread_id=thread.id)
        await db.commit()
        return {"action": "human_handoff", "response": None}

    # 5. Process through AI Gateway
    ai_result = await process_ai_message(
        user_message=message_content,
        session=ai_session,
        db=db,
    )

    # 6. Save AI Response as outbound Interaction
    outbound_msg = InteractionMessage(
        client_id=client_id,
        thread_id=str(thread.id),
        channel=channel_type,
        direction="outbound",
        sender_id="AI_SYSTEM",
        recipient_id=sender_id,
        content=ai_result["response"],
    )
    db.add(outbound_msg)

    # Handle Escalation State (Auto-assign to human)
    if ai_result["state"] == ConversationState.ESCALATION.value:
        thread.is_assigned_to_human = True
        logger.info("AI escalated conversation to human", thread_id=thread.id)

    await db.commit()

    return {
        "action": "reply",
        "response": ai_result["response"],
        "thread_id": str(thread.id),
        "intent": ai_result["intent"],
        "is_escalated": thread.is_assigned_to_human,
    }
