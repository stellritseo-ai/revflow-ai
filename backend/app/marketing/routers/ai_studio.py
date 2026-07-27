from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from pydantic import BaseModel
import uuid
from app.marketing.services.ai_marketing_studio import AIMarketingStudioService

router = APIRouter(prefix="/ai-studio", tags=["Marketing AI Studio"])

class GenerateCampaignRequest(BaseModel):
    prompt: str
    client_id: str

@router.post("/generate")
def generate_campaign(request: GenerateCampaignRequest, db: Session = Depends(get_db)):
    # This invokes the AI Marketing Strategist
    result = AIMarketingStudioService.generate_campaign_from_prompt(
        db=db,
        client_id=uuid.UUID(request.client_id),
        prompt=request.prompt
    )
    return result
