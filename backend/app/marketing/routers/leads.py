from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/leads", tags=["Marketing Leads"])

@router.get("/")
def get_leads(db: Session = Depends(get_db)):
    return {"message": "List of leads"}

@router.post("/")
def create_lead(db: Session = Depends(get_db)):
    return {"message": "Lead created"}
