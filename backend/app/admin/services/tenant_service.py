import uuid
from typing import List
from sqlalchemy.orm import Session
from app.models.models import Client
from app.admin.models.admin import Subscription

class TenantService:
    @staticmethod
    def get_all_tenants(db: Session) -> List[Client]:
        return db.query(Client).all()

    @staticmethod
    def suspend_tenant(db: Session, client_id: uuid.UUID) -> bool:
        client = db.query(Client).filter(Client.id == client_id).first()
        if client:
            client.active = False
            db.commit()
            return True
        return False

    @staticmethod
    def calculate_health_score(db: Session, client_id: uuid.UUID) -> int:
        # Mock logic to calculate a health score (0-100) based on AI usage, login frequency, etc.
        return 85
