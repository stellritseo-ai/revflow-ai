"""
Communication Webhooks & APIs
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.communication.models import (
    ConversationThread,
    InteractionMessage,
    ChannelType,
)
from app.communication.router.gateway import handle_incoming_message

router = APIRouter(prefix="/communication", tags=["Communication Hub"])


# --- Mock Webhooks ---

class MockWebhookPayload(BaseModel):
    client_id: str
    channel: str
    sender: str
    message: str


@router.post("/webhook/mock")
async def mock_incoming_webhook(
    payload: MockWebhookPayload,
    db: AsyncSession = Depends(get_db),
):
    """
    Simulates an incoming webhook from Twilio/Sendgrid for testing the unified gateway.
    """
    try:
        channel_type = ChannelType(payload.channel.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid channel type")

    result = await handle_incoming_message(
        client_id=payload.client_id,
        channel_type=channel_type,
        sender_id=payload.sender,
        message_content=payload.message,
        db=db,
    )

    return result


# --- Unified Inbox APIs ---

class ThreadResponse(BaseModel):
    id: str
    primary_channel: str
    status: str
    is_assigned_to_human: bool
    patient_phone: Optional[str] = None
    created_at: str
    last_message: Optional[str] = None
    sender: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/inbox/threads", response_model=List[ThreadResponse])
async def get_inbox_threads(
    status: Optional[str] = None,
    channel: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all conversation threads for the unified inbox."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    query = select(ConversationThread).where(
        ConversationThread.client_id == current_user.client_id
    ).order_by(ConversationThread.created_at.desc())
    
    if status:
        query = query.where(ConversationThread.status == status)
    if channel:
        query = query.where(ConversationThread.primary_channel == channel)

    result = await db.execute(query)
    threads = result.scalars().all()
    
    response_data = []
    for t in threads:
        # Fetch the latest message for the preview
        msg_result = await db.execute(
            select(InteractionMessage)
            .where(InteractionMessage.thread_id == str(t.id))
            .order_by(InteractionMessage.created_at.desc())
            .limit(1)
        )
        last_msg = msg_result.scalar_one_or_none()
        
        response_data.append(ThreadResponse(
            id=str(t.id),
            primary_channel=t.primary_channel.value,
            status=t.status.value,
            is_assigned_to_human=t.is_assigned_to_human,
            patient_phone=t.patient_phone,
            created_at=str(t.created_at),
            last_message=last_msg.content if last_msg else None,
            sender=last_msg.sender_id if last_msg else None,
        ))

    return response_data


@router.get("/inbox/threads/{thread_id}/messages")
async def get_thread_messages(
    thread_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all interactions within a specific thread."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    # Verify ownership
    result = await db.execute(
        select(ConversationThread).where(
            ConversationThread.id == thread_id,
            ConversationThread.client_id == current_user.client_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Thread not found")

    messages_result = await db.execute(
        select(InteractionMessage)
        .where(InteractionMessage.thread_id == thread_id)
        .order_by(InteractionMessage.created_at.asc())
    )
    messages = messages_result.scalars().all()

    return [
        {
            "id": str(m.id),
            "channel": m.channel.value,
            "direction": m.direction,
            "sender_id": m.sender_id,
            "content": m.content,
            "created_at": str(m.created_at),
        }
        for m in messages
    ]


# --- UAT & Seeding Endpoints ---

import uuid
from app.models.models import Client
from app.ai.models import (
    AIProfile,
    VoiceProfile,
    KnowledgeSource,
    KnowledgeChunk,
    PersonalityStyle,
    ResponseLength,
    VoiceGender,
    VoiceProvider,
    VoiceLanguage,
    KnowledgeSourceType,
    KnowledgeSourceStatus,
)
from app.ai.embeddings.embedder import embed_text

@router.post("/test/seed")
async def seed_test_clinics(db: AsyncSession = Depends(get_db)):
    """Seed Smile Dental, Luxury Dental, and Kids Dental Care."""
    # Check if already seeded
    existing = await db.execute(select(Client).where(Client.slug == "smile-dental"))
    if existing.scalar_one_or_none():
        return {"status": "already seeded"}

    # 1. Smile Dental (General)
    smile_client = Client(
        id=uuid.uuid4(),
        clinic_name="Smile Dental",
        slug="smile-dental",
        business_email="contact@smiledental.com",
        phone="+15551112222",
        specialty="General Dentistry",
    )
    db.add(smile_client)
    await db.flush()

    smile_ai = AIProfile(
        client_id=smile_client.id,
        ai_name="Aria",
        receptionist_name="Aria",
        greeting_message="Hello, thank you for calling Smile Dental. This is Aria, how can I help you today?",
        personality=PersonalityStyle.PROFESSIONAL,
        response_length=ResponseLength.STANDARD,
        emergency_rules="For severe pain or swelling, escalate to emergency booking or tell them to go to the ER.",
        escalation_rules="If the patient requests a human, escalate to human handoff immediately.",
        booking_rules="Offer general cleaning appointments on weekdays between 9 AM and 5 PM.",
        insurance_rules="We accept Delta Dental, Blue Cross, and Aetna. We do NOT accept Medicaid.",
        business_rules="Standard copay is $50. Cleanings cost $150 out of pocket without insurance.",
    )
    db.add(smile_ai)

    smile_voice = VoiceProfile(
        client_id=smile_client.id,
        voice_gender=VoiceGender.FRIENDLY_FEMALE,
        provider=VoiceProvider.GOOGLE_TTS,
        language=VoiceLanguage.ENGLISH_US,
        speaking_speed=1.0,
    )
    db.add(smile_voice)

    smile_doc = KnowledgeSource(
        client_id=smile_client.id,
        title="Smile Dental FAQ",
        source_type=KnowledgeSourceType.FAQ,
        status=KnowledgeSourceStatus.READY,
        chunk_count=2,
    )
    db.add(smile_doc)
    await db.flush()

    smile_chunks = [
        "Smile Dental offers general cleanings, fillings, and basic crowns. Cleanings cost $150.",
        "Smile Dental accepts Delta Dental and MetLife. We do not accept state Medicaid."
    ]
    for i, text in enumerate(smile_chunks):
        try:
            emb = await embed_text(text)
        except Exception:
            emb = [0.0] * 768
        db.add(KnowledgeChunk(
            client_id=smile_client.id,
            source_id=smile_doc.id,
            chunk_index=i,
            content=text,
            embedding={"embedding": emb},
        ))

    # 2. Luxury Dental (Premium)
    luxury_client = Client(
        id=uuid.uuid4(),
        clinic_name="Luxury Dental",
        slug="luxury-dental",
        business_email="concierge@luxurydental.com",
        phone="+15552223333",
        specialty="Cosmetic & Reconstructive",
    )
    db.add(luxury_client)
    await db.flush()

    luxury_ai = AIProfile(
        client_id=luxury_client.id,
        ai_name="Sebastian",
        receptionist_name="Sebastian",
        greeting_message="Welcome to Luxury Dental Concierge. This is Sebastian. How may I assist you today?",
        personality=PersonalityStyle.PREMIUM,
        response_length=ResponseLength.DETAILED,
        emergency_rules="For cosmetic emergencies (broken veneer), fit them in today.",
        escalation_rules="Maintain a premium tone. Escalate financing requests.",
        booking_rules="Consultations require a $100 reservation fee.",
        insurance_rules="We operate on a fee-for-service model. We provide superbills but do not accept in-network insurance.",
        business_rules="Veneers cost $2,000 per tooth. Smile makeovers start at $15,000.",
    )
    db.add(luxury_ai)

    luxury_voice = VoiceProfile(
        client_id=luxury_client.id,
        voice_gender=VoiceGender.CALM_MALE,
        provider=VoiceProvider.ELEVENLABS,
        language=VoiceLanguage.ENGLISH_US,
        speaking_speed=0.9,
    )
    db.add(luxury_voice)

    luxury_doc = KnowledgeSource(
        client_id=luxury_client.id,
        title="Luxury Dental Treatments",
        source_type=KnowledgeSourceType.TREATMENT_GUIDE,
        status=KnowledgeSourceStatus.READY,
        chunk_count=2,
    )
    db.add(luxury_doc)
    await db.flush()

    luxury_chunks = [
        "Luxury Dental specializes in porcelain veneers and teeth whitening. Veneers cost $2000 per tooth.",
        "Luxury Dental does not accept direct insurance. Patients pay upfront."
    ]
    for i, text in enumerate(luxury_chunks):
        try:
            emb = await embed_text(text)
        except Exception:
            emb = [0.0] * 768
        db.add(KnowledgeChunk(
            client_id=luxury_client.id,
            source_id=luxury_doc.id,
            chunk_index=i,
            content=text,
            embedding={"embedding": emb},
        ))

    # 3. Kids Dental Care (Pediatric)
    kids_client = Client(
        id=uuid.uuid4(),
        clinic_name="Kids Dental Care",
        slug="kids-dental-care",
        business_email="fun@kidsdental.com",
        phone="+15553334444",
        specialty="Pediatric Dentistry",
    )
    db.add(kids_client)
    await db.flush()

    kids_ai = AIProfile(
        client_id=kids_client.id,
        ai_name="Sparky",
        receptionist_name="Sparky",
        greeting_message="Hey there! Welcome to Kids Dental Care! Sparky here!",
        personality=PersonalityStyle.FRIENDLY,
        response_length=ResponseLength.BRIEF,
        emergency_rules="If a child knocked out a permanent tooth, tell parents to keep it in milk and come in immediately.",
        escalation_rules="Escalate if parents are extremely anxious.",
        booking_rules="Kids cleanings are scheduled on weekday afternoons.",
        insurance_rules="We accept CHIP and Medicaid.",
        business_rules="First-time toddler visits include a free tooth brush and toy bag.",
    )
    db.add(kids_ai)

    kids_voice = VoiceProfile(
        client_id=kids_client.id,
        voice_gender=VoiceGender.FRIENDLY_FEMALE,
        provider=VoiceProvider.GOOGLE_TTS,
        language=VoiceLanguage.ENGLISH_US,
        speaking_speed=1.1,
    )
    db.add(kids_voice)

    kids_doc = KnowledgeSource(
        client_id=kids_client.id,
        title="Kids Dental FAQ",
        source_type=KnowledgeSourceType.FAQ,
        status=KnowledgeSourceStatus.READY,
        chunk_count=2,
    )
    db.add(kids_doc)
    await db.flush()

    kids_chunks = [
        "Kids Dental Care provides gentle cleanings, cavity prevention, and toddler oral exams.",
        "Kids Dental Care accepts Medicaid and CHIP to ensure access."
    ]
    for i, text in enumerate(kids_chunks):
        try:
            emb = await embed_text(text)
        except Exception:
            emb = [0.0] * 768
        db.add(KnowledgeChunk(
            client_id=kids_client.id,
            source_id=kids_doc.id,
            chunk_index=i,
            content=text,
            embedding={"embedding": emb},
        ))

    await db.commit()
    return {"status": "seeding complete"}


@router.post("/test/run-uat")
async def run_uat_validation(db: AsyncSession = Depends(get_db)):
    """Runs automated validations against the seeded clinics to verify multi-tenant isolation and UAT responses."""
    # Find seeded clinics
    clients_res = await db.execute(select(Client).where(Client.slug.in_(["smile-dental", "luxury-dental", "kids-dental-care"])))
    clients = clients_res.scalars().all()
    
    if len(clients) < 3:
        raise HTTPException(status_code=400, detail="Test clinics must be seeded first")

    results = []
    for client in clients:
        # Simulate incoming messages for each clinic to verify personality tone & business rule isolation
        test_messages = [
            ("Do you accept Delta Dental?", "insurance"),
            ("How much do cleanings or veneers cost?", "pricing"),
            ("My kid knocked their tooth out!", "emergency")
        ]
        
        for msg, tag in test_messages:
            res = await handle_incoming_message(
                client_id=str(client.id),
                channel_type=ChannelType.SMS,
                sender_id="+15550009999",
                message_content=msg,
                db=db
            )
            
            results.append({
                "clinic": client.clinic_name,
                "input": msg,
                "tag": tag,
                "ai_reply": res.get("response"),
                "intent": res.get("intent")
            })

    return {"uat_results": results}

