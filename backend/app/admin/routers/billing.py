from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/billing", tags=["Admin Billing"])

@router.get("/")
def get_billing_overview(db: Session = Depends(get_db)):
    return {"message": "Billing overview"}
