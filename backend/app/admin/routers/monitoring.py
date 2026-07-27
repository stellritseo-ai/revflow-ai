from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/monitoring", tags=["Admin Monitoring"])

@router.get("/health")
def get_health(db: Session = Depends(get_db)):
    return {"status": "healthy", "cpu": "12%", "ram": "42%"}
