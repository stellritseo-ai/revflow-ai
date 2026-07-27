from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/journeys", tags=["Marketing Journeys"])

@router.get("/")
def get_journeys(db: Session = Depends(get_db)):
    return {"message": "List of journeys"}

@router.post("/")
def create_journey(db: Session = Depends(get_db)):
    return {"message": "Journey created"}
