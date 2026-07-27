import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.marketing.models.marketing import MarketingCampaign, CampaignStatus, CampaignType

class CampaignService:
    @staticmethod
    def get_campaigns(db: Session, client_id: uuid.UUID) -> List[MarketingCampaign]:
        return db.query(MarketingCampaign).filter(MarketingCampaign.client_id == client_id).all()

    @staticmethod
    def create_campaign(db: Session, client_id: uuid.UUID, name: str, campaign_type: CampaignType, **kwargs) -> MarketingCampaign:
        campaign = MarketingCampaign(
            client_id=client_id,
            name=name,
            campaign_type=campaign_type,
            **kwargs
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        return campaign

    @staticmethod
    def update_campaign_status(db: Session, campaign_id: uuid.UUID, status: CampaignStatus) -> Optional[MarketingCampaign]:
        campaign = db.query(MarketingCampaign).filter(MarketingCampaign.id == campaign_id).first()
        if campaign:
            campaign.status = status
            db.commit()
            db.refresh(campaign)
        return campaign
