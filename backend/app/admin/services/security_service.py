import uuid
from sqlalchemy.orm import Session
from app.models.models import User

class SecurityService:
    @staticmethod
    def audit_admin_action(db: Session, admin_id: str, action: str, target: str):
        # In a real app, this writes to an AuditLog table
        print(f"AUDIT: Admin {admin_id} performed '{action}' on '{target}'")

    @staticmethod
    def detect_abnormal_usage(db: Session) -> list:
        # Example logic to flag tenants with > 1000% usage spike
        return []
