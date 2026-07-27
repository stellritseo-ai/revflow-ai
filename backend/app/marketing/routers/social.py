from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/social", tags=["Marketing Social"])

@router.get("/posts")
def get_social_posts(db: Session = Depends(get_db)):
    return {"message": "List of social posts"}

@router.post("/posts")
def schedule_post(db: Session = Depends(get_db)):
    return {"message": "Post scheduled"}
