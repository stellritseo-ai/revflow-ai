from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/dashboard", tags=["Admin Dashboard"])

@router.get("/")
def get_dashboard_stats(db: Session = Depends(get_db)):
    return {
        "total_clinics": 42,
        "active_clinics": 38,
        "mrr": 5200.0,
        "ai_requests_today": 1450,
        "system_health": "healthy"
    }
