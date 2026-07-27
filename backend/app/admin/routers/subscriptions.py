from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/subscriptions", tags=["Admin Subscriptions"])

@router.get("/")
def list_subscriptions(db: Session = Depends(get_db)):
    return {"message": "List of subscriptions"}

@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    return {"message": "List of subscription plans"}
