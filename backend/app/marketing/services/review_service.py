import uuid
from typing import List
from sqlalchemy.orm import Session
from app.marketing.models.marketing import Review

class ReviewService:
    @staticmethod
    def get_reviews(db: Session, client_id: uuid.UUID) -> List[Review]:
        return db.query(Review).filter(Review.client_id == client_id).all()

    @staticmethod
    def add_review(db: Session, client_id: uuid.UUID, source: str, rating: int, reviewer_name: str, content: str = None) -> Review:
        review = Review(
            client_id=client_id,
            source=source,
            rating=rating,
            reviewer_name=reviewer_name,
            content=content,
            requires_escalation=(rating <= 3)
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review
