from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/security", tags=["Admin Security"])

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    return {"message": "List of audit logs"}
