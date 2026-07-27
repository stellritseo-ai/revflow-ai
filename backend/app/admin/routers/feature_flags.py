from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/feature-flags", tags=["Admin Feature Flags"])

@router.get("/")
def get_feature_flags(db: Session = Depends(get_db)):
    return {"message": "List of feature flags"}
