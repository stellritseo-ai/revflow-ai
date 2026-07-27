from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/reviews", tags=["Marketing Reviews"])

@router.get("/")
def get_reviews(db: Session = Depends(get_db)):
    return {"message": "List of reviews"}

@router.post("/request")
def request_review(db: Session = Depends(get_db)):
    return {"message": "Review requested"}
