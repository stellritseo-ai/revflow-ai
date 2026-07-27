from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/support", tags=["Admin Support"])

@router.get("/tickets")
def get_tickets(db: Session = Depends(get_db)):
    return {"message": "List of support tickets"}
