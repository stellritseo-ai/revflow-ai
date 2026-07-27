"""
AI Gateway — Main orchestration entry point.
Coordinates prompt building, RAG retrieval, Gemini generation,
intent detection, lead extraction, and state transitions.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.ai.providers.gemini import gemini
from app.ai.prompts.builder import build_system_prompt, build_memory_summary
from app.ai.rag.retriever import retrieve_relevant_chunks, format_chunks_for_prompt
from app.ai.classifiers.intent import classify_intent
from app.ai.extractors.lead import extract_patient_info_from_message
from app.ai.memory.memory import build_history_for_gemini
from app.ai.conversations.engine import (
    determine_next_state,
    transition_state,
    add_message,
)
from app.ai.models import (
    AIProfile,
    VoiceProfile,
    ConversationSession,
    ConversationState,
    ConversationRole,
    LeadExtraction,
)
from app.models.models import Client, ClientSettings

logger = structlog.get_logger()


async def process_ai_message(
    user_message: str,
    session: ConversationSession,
    db: AsyncSession,
) -> dict:
    """
    Main AI Gateway — processes a patient message end-to-end.
    
    1. Load clinic context (AI profile, settings)
    2. Retrieve relevant knowledge via RAG
    3. Build dynamic system prompt
    4. Generate Gemini response
    5. Classify intent
    6. Extract lead data
    7. Update conversation state
    8. Persist everything
    
    Returns:
        {response, intent, state, lead_data, rag_used}
    """
    client_id = session.client_id

    # 0. Prompt Injection Guard (Heuristics)
    injection_keywords = [
        "ignore previous",
        "ignore all previous",
        "system prompt",
        "you are a completely different",
        "new instructions",
        "forget everything",
        "bypass",
    ]
    lower_msg = user_message.lower()
    if any(keyword in lower_msg for keyword in injection_keywords):
        logger.warning("Prompt injection attempt detected", client_id=str(client_id), user_message=user_message)
        # Force a safe fallback message and block LLM processing
        ai_response = "I'm sorry, I cannot process that request as it violates our safety policies. How can I help you with your dental appointment?"
        await add_message(session=session, role=ConversationRole.USER, content=user_message, db=db, detected_intent="security_violation")
        await add_message(session=session, role=ConversationRole.ASSISTANT, content=ai_response, db=db)
        await db.flush()
        return {
            "response": ai_response,
            "intent": "security_violation",
            "intent_confidence": 1.0,
            "state": session.current_state.value,
            "rag_chunks_used": 0,
            "lead_data": {},
        }

    # 1. Load AI profile
    ai_profile_result = await db.execute(
        select(AIProfile).where(AIProfile.client_id == client_id)
    )
    ai_profile = ai_profile_result.scalar_one_or_none()

    # Load clinic info
    client_result = await db.execute(
        select(Client).where(Client.id == client_id)
    )
    client = client_result.scalar_one_or_none()

    settings_result = await db.execute(
        select(ClientSettings).where(ClientSettings.client_id == client_id)
    )
    clinic_settings = settings_result.scalar_one_or_none()

    # Use defaults if no AI profile configured
    if not ai_profile:
        ai_profile = AIProfile(
            client_id=client_id,
            ai_name="Aria",
            receptionist_name="Aria",
        )

    # 2. Retrieve RAG context
    rag_chunks = await retrieve_relevant_chunks(
        query=user_message,
        client_id=str(client_id),
        db=db,
        top_k=5,
    )
    rag_context = format_chunks_for_prompt(rag_chunks) if rag_chunks else None

    # 3. Build memory summary from session
    memory_data = {
        "patient_name": session.patient_name,
        "patient_phone": session.patient_phone,
        "patient_email": session.patient_email,
        "patient_insurance": session.patient_insurance,
        "summary": session.summary,
    }
    memory_summary = build_memory_summary({k: v for k, v in memory_data.items() if v})

    # 4. Build system prompt
    business_hours = None
    if clinic_settings and clinic_settings.business_hours:
        hours = clinic_settings.business_hours
        if isinstance(hours, dict):
            lines = []
            for day, h in hours.items():
                if isinstance(h, dict) and h.get("open"):
                    lines.append(f"  {day}: {h.get('open', '')} – {h.get('close', '')}")
                elif h == "closed":
                    lines.append(f"  {day}: Closed")
            business_hours = "\n".join(lines)

    system_prompt = build_system_prompt(
        ai_profile=ai_profile,
        clinic_name=client.clinic_name if client else "Our Clinic",
        clinic_address=client.address if client else None,
        clinic_phone=client.phone if client else None,
        business_hours=business_hours,
        rag_context=rag_context,
        conversation_memory=memory_summary if memory_summary else None,
    )

    # 5. Build conversation history for context
    history_msgs = [
        {"role": m.role.value, "content": m.content}
        for m in session.messages[-10:]
    ] if hasattr(session, "messages") and session.messages else []
    history = build_history_for_gemini(history_msgs)

    # 6. Generate response
    ai_response = await gemini.generate(
        system_prompt=system_prompt,
        user_message=user_message,
        history=history,
        temperature=0.7,
        max_tokens=512,
    )

    # 7. Classify intent
    intent, confidence = await classify_intent(user_message)

    # 8. Extract patient info from this message
    extracted = await extract_patient_info_from_message(user_message)
    if extracted.get("phone") and not session.patient_phone:
        session.patient_phone = extracted["phone"]
    if extracted.get("email") and not session.patient_email:
        session.patient_email = extracted["email"]

    # 9. Persist user message
    await add_message(
        session=session,
        role=ConversationRole.USER,
        content=user_message,
        db=db,
        detected_intent=intent,
    )

    # 10. Persist assistant response
    await add_message(
        session=session,
        role=ConversationRole.ASSISTANT,
        content=ai_response,
        db=db,
        rag_chunks_used=[c.get("source_title") for c in rag_chunks] if rag_chunks else [],
    )

    # 11. State machine transition
    next_state = determine_next_state(session.current_state, intent, ai_response)
    if next_state:
        await transition_state(session, next_state, trigger=intent, db=db)

    await db.flush()

    return {
        "response": ai_response,
        "intent": intent,
        "intent_confidence": confidence,
        "state": session.current_state.value,
        "rag_chunks_used": len(rag_chunks),
        "lead_data": extracted,
    }
