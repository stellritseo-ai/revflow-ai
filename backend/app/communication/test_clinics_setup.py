"""
Seed script to create three realistic dental clinics with different AI profiles,
voice settings, and knowledge bases to verify multi-tenant isolation.
"""
import asyncio
import uuid
from app.core.database import AsyncSessionLocal
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

async def seed_clinics():
    print("Starting clinic seeding...")
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        from sqlalchemy import select
        existing = await session.execute(select(Client).where(Client.slug == "smile-dental"))
        if existing.scalar_one_or_none():
            print("Clinics already seeded. Skipping.")
            return

        # -------------------------------------------------------------
        # CLINIC 1: Smile Dental (General Dentistry)
        # -------------------------------------------------------------
        smile_client = Client(
            id=uuid.uuid4(),
            clinic_name="Smile Dental",
            slug="smile-dental",
            business_email="contact@smiledental.com",
            phone="+15551112222",
            specialty="General Dentistry",
        )
        session.add(smile_client)
        await session.flush()

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
        session.add(smile_ai)

        smile_voice = VoiceProfile(
            client_id=smile_client.id,
            voice_gender=VoiceGender.FRIENDLY_FEMALE,
            provider=VoiceProvider.GOOGLE_TTS,
            language=VoiceLanguage.ENGLISH_US,
            speaking_speed=1.0,
        )
        session.add(smile_voice)

        # Knowledge Base for Smile Dental
        smile_doc = KnowledgeSource(
            client_id=smile_client.id,
            title="Smile Dental FAQ & General Policies",
            source_type=KnowledgeSourceType.FAQ,
            status=KnowledgeSourceStatus.READY,
            chunk_count=2,
            character_count=500,
        )
        session.add(smile_doc)
        await session.flush()

        smile_chunks = [
            "Smile Dental offers general cleanings, fillings, and basic crowns. Cleanings cost $150.",
            "Smile Dental accepts Delta Dental and MetLife. We do not accept state Medicaid."
        ]
        for i, text in enumerate(smile_chunks):
            try:
                emb = await embed_text(text)
            except Exception:
                emb = [0.0] * 768
            
            chunk = KnowledgeChunk(
                client_id=smile_client.id,
                source_id=smile_doc.id,
                chunk_index=i,
                content=text,
                embedding={"embedding": emb},
                token_count=len(text.split()),
            )
            session.add(chunk)

        # -------------------------------------------------------------
        # CLINIC 2: Luxury Dental (Cosmetic Dentistry)
        # -------------------------------------------------------------
        luxury_client = Client(
            id=uuid.uuid4(),
            clinic_name="Luxury Dental",
            slug="luxury-dental",
            business_email="concierge@luxurydental.com",
            phone="+15552223333",
            specialty="Cosmetic & Reconstructive",
        )
        session.add(luxury_client)
        await session.flush()

        luxury_ai = AIProfile(
            client_id=luxury_client.id,
            ai_name="Sebastian",
            receptionist_name="Sebastian",
            greeting_message="Welcome to Luxury Dental Concierge. This is Sebastian. How may I assist you with your smile transformation today?",
            personality=PersonalityStyle.PREMIUM,
            response_length=ResponseLength.DETAILED,
            emergency_rules="For cosmetic emergencies (broken veneer before event), fit them in today.",
            escalation_rules="Always maintain a polite, high-end demeanor. Escalate custom financing requests.",
            booking_rules="Consultations require a $100 reservation fee. Appointments are 1 hour minimum.",
            insurance_rules="We operate on a fee-for-service model. We provide superbills but do not accept in-network insurance.",
            business_rules="Veneers cost $2,000 per tooth. Smile makeovers start at $15,000.",
        )
        session.add(luxury_ai)

        luxury_voice = VoiceProfile(
            client_id=luxury_client.id,
            voice_gender=VoiceGender.CALM_MALE,
            provider=VoiceProvider.ELEVENLABS,
            language=VoiceLanguage.ENGLISH_US,
            speaking_speed=0.9,
            provider_voice_id="luxury_male_voice_id",
        )
        session.add(luxury_voice)

        # Knowledge Base for Luxury Dental
        luxury_doc = KnowledgeSource(
            client_id=luxury_client.id,
            title="Luxury Dental Cosmetic Treatments & Financing",
            source_type=KnowledgeSourceType.TREATMENT_GUIDE,
            status=KnowledgeSourceStatus.READY,
            chunk_count=2,
            character_count=600,
        )
        session.add(luxury_doc)
        await session.flush()

        luxury_chunks = [
            "Luxury Dental specializes in porcelain veneers, teeth whitening, and full mouth smile makeovers. Veneers cost $2000 per tooth.",
            "Luxury Dental does not accept direct insurance. Patients pay upfront and we submit superbills."
        ]
        for i, text in enumerate(luxury_chunks):
            try:
                emb = await embed_text(text)
            except Exception:
                emb = [0.0] * 768
            chunk = KnowledgeChunk(
                client_id=luxury_client.id,
                source_id=luxury_doc.id,
                chunk_index=i,
                content=text,
                embedding={"embedding": emb},
                token_count=len(text.split()),
            )
            session.add(chunk)

        # -------------------------------------------------------------
        # CLINIC 3: Kids Dental Care (Pediatric)
        # -------------------------------------------------------------
        kids_client = Client(
            id=uuid.uuid4(),
            clinic_name="Kids Dental Care",
            slug="kids-dental-care",
            business_email="fun@kidsdental.com",
            phone="+15553334444",
            specialty="Pediatric Dentistry",
        )
        session.add(kids_client)
        await session.flush()

        kids_ai = AIProfile(
            client_id=kids_client.id,
            ai_name="Sparky",
            receptionist_name="Sparky",
            greeting_message="Hey there! Welcome to Kids Dental Care! Sparky here, ready to chat about healthy teeth!",
            personality=PersonalityStyle.FRIENDLY,
            response_length=ResponseLength.BRIEF,
            emergency_rules="If a child knocked out a permanent tooth, tell the parents to keep it in milk and come in immediately.",
            escalation_rules="Escalate if parents are extremely anxious or requesting specific sedation answers.",
            booking_rules="Kids cleanings are scheduled on weekday afternoons. Parents must accompany the child.",
            insurance_rules="We accept CHIP, Medicaid, and most major PPO insurances.",
            business_rules="First-time toddler visits include a free tooth brush and toy bag.",
        )
        session.add(kids_ai)

        kids_voice = VoiceProfile(
            client_id=kids_client.id,
            voice_gender=VoiceGender.FRIENDLY_FEMALE,
            provider=VoiceProvider.GOOGLE_TTS,
            language=VoiceLanguage.ENGLISH_US,
            speaking_speed=1.1,
        )
        session.add(kids_voice)

        # Knowledge Base for Kids Dental
        kids_doc = KnowledgeSource(
            client_id=kids_client.id,
            title="Kids Dental Fun Guides & Pediatric FAQs",
            source_type=KnowledgeSourceType.FAQ,
            status=KnowledgeSourceStatus.READY,
            chunk_count=2,
            character_count=500,
        )
        session.add(kids_doc)
        await session.flush()

        kids_chunks = [
            "Kids Dental Care provides gentle cleanings, cavity prevention, and toddler oral exams.",
            "Kids Dental Care accepts Medicaid and CHIP to ensure all children have access to healthy smiles."
        ]
        for i, text in enumerate(kids_chunks):
            try:
                emb = await embed_text(text)
            except Exception:
                emb = [0.0] * 768
            chunk = KnowledgeChunk(
                client_id=kids_client.id,
                source_id=kids_doc.id,
                chunk_index=i,
                content=text,
                embedding={"embedding": emb},
                token_count=len(text.split()),
            )
            session.add(chunk)

        await session.commit()
        print("Successfully seeded Smile Dental, Luxury Dental, and Kids Dental Care!")

if __name__ == "__main__":
    asyncio.run(seed_clinics())
