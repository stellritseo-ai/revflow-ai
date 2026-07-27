from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/dashboard", tags=["Marketing Dashboard"])

@router.get("/kpis")
def get_marketing_kpis(db: Session = Depends(get_db)):
    return {
        "active_campaigns": 5,
        "leads_generated": 120,
        "conversion_rate": "15%",
        "roi": "$4,500"
    }
