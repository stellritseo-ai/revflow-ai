import uuid
from sqlalchemy.orm import Session
from app.admin.models.admin import BillingAccount, Subscription, UsageMetric

class BillingService:
    @staticmethod
    def get_billing_account(db: Session, client_id: uuid.UUID) -> BillingAccount:
        return db.query(BillingAccount).filter(BillingAccount.client_id == client_id).first()

    @staticmethod
    def calculate_monthly_usage_cost(db: Session, client_id: uuid.UUID, month: str) -> float:
        # Calculate costs based on usage metrics (tokens, minutes, sms)
        usage = db.query(UsageMetric).filter(UsageMetric.client_id == client_id, UsageMetric.period_month == month).first()
        if not usage:
            return 0.0
            
        # Example pricing
        ai_cost = usage.ai_requests * 0.01
        voice_cost = usage.voice_minutes * 0.05
        sms_cost = usage.sms_sent * 0.02
        
        return ai_cost + voice_cost + sms_cost
