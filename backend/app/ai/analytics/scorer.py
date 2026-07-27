"""
Conversation Quality Scorer — Automatically scores completed AI conversations.
Scores: accuracy, empathy, professionalism, booking success, knowledge usage.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import List
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.providers.gemini import gemini
from app.ai.models import ConversationScore, ConversationSession

logger = structlog.get_logger()


async def score_conversation(
    session: ConversationSession,
    messages: List[dict],
    db: AsyncSession,
) -> ConversationScore:
    """
    Score a completed conversation across 5 quality dimensions.
    Returns and persists a ConversationScore record.
    """
    if not messages:
        return _create_default_score(session, db)

    # Build transcript
    transcript = "\n".join(
        f"{'Patient' if m.get('role') == 'user' else 'AI'}: {m.get('content', '')}"
        for m in messages
    )

    system = """You are a quality assurance evaluator for a dental clinic AI receptionist.
Score this conversation across 5 dimensions, each from 0 to 100.

Return ONLY this JSON:
{
    "accuracy_score": 85,
    "empathy_score": 90,
    "professionalism_score": 88,
    "booking_success_score": 75,
    "knowledge_usage_score": 80,
    "notes": "Brief evaluation note"
}

Scoring criteria:
- accuracy_score: Did the AI provide correct, relevant information?
- empathy_score: Did the AI acknowledge patient concerns and show care?
- professionalism_score: Was the communication professional and appropriate?
- booking_success_score: Did the conversation lead to a booking or clear next step? (100 = booked, 0 = no progress)
- knowledge_usage_score: Did the AI effectively use available knowledge to answer questions?
"""

    result = await gemini.generate_json(system, f"Conversation transcript:\n{transcript[:3000]}")

    def clamp(v, lo=0, hi=100):
        try:
            return max(lo, min(hi, float(v)))
        except (TypeError, ValueError):
            return 50.0

    accuracy = clamp(result.get("accuracy_score", 75))
    empathy = clamp(result.get("empathy_score", 75))
    professionalism = clamp(result.get("professionalism_score", 75))
    booking = clamp(result.get("booking_success_score", 50))
    knowledge = clamp(result.get("knowledge_usage_score", 60))
    overall = (accuracy + empathy + professionalism + booking + knowledge) / 5

    score = ConversationScore(
        session_id=session.id,
        client_id=session.client_id,
        accuracy_score=accuracy,
        empathy_score=empathy,
        professionalism_score=professionalism,
        booking_success_score=booking,
        knowledge_usage_score=knowledge,
        overall_score=overall,
        scored_at=datetime.now(timezone.utc).isoformat(),
        score_notes=result.get("notes", ""),
    )
    db.add(score)
    return score


def _create_default_score(session: ConversationSession, db: AsyncSession) -> ConversationScore:
    """Create a default score when transcript is unavailable."""
    score = ConversationScore(
        session_id=session.id,
        client_id=session.client_id,
        accuracy_score=0.0,
        empathy_score=0.0,
        professionalism_score=0.0,
        booking_success_score=0.0,
        knowledge_usage_score=0.0,
        overall_score=0.0,
        scored_at=datetime.now(timezone.utc).isoformat(),
        score_notes="No messages to score",
    )
    db.add(score)
    return score
