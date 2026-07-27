from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/landing-pages", tags=["Marketing Landing Pages"])

@router.get("/")
def get_landing_pages(db: Session = Depends(get_db)):
    return {"message": "List of landing pages"}

@router.post("/")
def create_landing_page(db: Session = Depends(get_db)):
    return {"message": "Landing page created"}
