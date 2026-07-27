"""
Conversations Router — AI Chat endpoint + session management.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.ai.models import (
    ConversationSession,
    ConversationState,
    ConversationRole,
)
from app.ai.gateway.gateway import process_ai_message

router = APIRouter(prefix="/ai/conversations", tags=["AI Conversations"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    call_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str
    intent: str
    intent_confidence: float
    state: str
    rag_chunks_used: int
    lead_data: dict


class SessionResponse(BaseModel):
    id: str
    current_state: str
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    total_messages: int
    lead_status: str
    is_active: bool


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Main AI chat endpoint. Creates a session if none provided.
    Routes message through the full AI gateway pipeline.
    """
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    client_id = current_user.client_id

    # Get or create session
    session = None
    if payload.session_id:
        result = await db.execute(
            select(ConversationSession).where(
                ConversationSession.id == payload.session_id,
                ConversationSession.client_id == client_id,
            )
        )
        session = result.scalar_one_or_none()

    if not session:
        import uuid
        session = ConversationSession(
            client_id=client_id,
            call_id=payload.call_id,
            current_state=ConversationState.GREETING,
            lead_status="new",
        )
        db.add(session)
        await db.flush()

    # Process through AI gateway
    result = await process_ai_message(
        user_message=payload.message,
        session=session,
        db=db,
    )

    await db.commit()

    return ChatResponse(
        response=result["response"],
        session_id=str(session.id),
        intent=result["intent"],
        intent_confidence=result["intent_confidence"],
        state=result["state"],
        rag_chunks_used=result["rag_chunks_used"],
        lead_data=result["lead_data"],
    )


@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    """List recent conversation sessions for the current clinic."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(ConversationSession)
        .where(ConversationSession.client_id == current_user.client_id)
        .order_by(ConversationSession.created_at.desc())
        .limit(limit)
    )
    sessions = result.scalars().all()

    return [
        SessionResponse(
            id=str(s.id),
            current_state=s.current_state.value,
            patient_name=s.patient_name,
            patient_phone=s.patient_phone,
            total_messages=s.total_messages,
            lead_status=s.lead_status,
            is_active=s.is_active,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages for a conversation session."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    from app.ai.models import ConversationMessage

    result = await db.execute(
        select(ConversationMessage)
        .where(
            ConversationMessage.session_id == session_id,
            ConversationMessage.client_id == current_user.client_id,
        )
        .order_by(ConversationMessage.created_at)
    )
    messages = result.scalars().all()

    return [
        {
            "id": str(m.id),
            "role": m.role.value,
            "content": m.content,
            "detected_intent": m.detected_intent,
            "created_at": m.created_at,
        }
        for m in messages
    ]
