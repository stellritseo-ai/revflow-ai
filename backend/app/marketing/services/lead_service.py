import uuid
from typing import List
from sqlalchemy.orm import Session
from app.marketing.models.marketing import MarketingLead

class LeadService:
    @staticmethod
    def get_leads(db: Session, client_id: uuid.UUID) -> List[MarketingLead]:
        return db.query(MarketingLead).filter(MarketingLead.client_id == client_id).all()

    @staticmethod
    def create_lead(db: Session, client_id: uuid.UUID, source: str, first_name: str, last_name: str, email: str = None, phone: str = None) -> MarketingLead:
        # Basic mock AI lead scoring
        score = 85 if phone else 50
        
        lead = MarketingLead(
            client_id=client_id,
            source=source,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            status="new",
            ai_lead_score=score
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead
