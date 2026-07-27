from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
# In a real app, you'd use a dependency to get the current client/user
# from app.api.deps import get_current_client

router = APIRouter(prefix="/campaigns", tags=["Marketing Campaigns"])

@router.get("/")
def get_campaigns(db: Session = Depends(get_db)):
    # return CampaignService.get_campaigns(db, client_id)
    return {"message": "List of campaigns"}

@router.post("/")
def create_campaign(db: Session = Depends(get_db)):
    return {"message": "Campaign created"}
