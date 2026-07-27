import uuid
from typing import List
from sqlalchemy.orm import Session
from app.marketing.models.marketing import PatientJourney, CampaignStatus

class JourneyService:
    @staticmethod
    def get_journeys(db: Session, client_id: uuid.UUID) -> List[PatientJourney]:
        return db.query(PatientJourney).filter(PatientJourney.client_id == client_id).all()

    @staticmethod
    def create_journey(db: Session, client_id: uuid.UUID, name: str, trigger_event: str, workflow_definition: dict) -> PatientJourney:
        journey = PatientJourney(
            client_id=client_id,
            name=name,
            trigger_event=trigger_event,
            workflow_definition=workflow_definition,
            status=CampaignStatus.DRAFT
        )
        db.add(journey)
        db.commit()
        db.refresh(journey)
        return journey
