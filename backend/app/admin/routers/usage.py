from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
import uuid
from app.admin.services.billing_service import BillingService

router = APIRouter(prefix="/usage", tags=["Admin Usage"])

@router.get("/{client_id}/cost")
def get_tenant_cost(client_id: uuid.UUID, month: str, db: Session = Depends(get_db)):
    cost = BillingService.calculate_monthly_usage_cost(db, client_id, month)
    return {"client_id": client_id, "month": month, "cost": cost}
