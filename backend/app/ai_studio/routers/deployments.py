import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.ai_studio.models.studio import DeploymentHistory

router = APIRouter(prefix="/deployments", tags=["AI Studio Deployments"])

class DeploymentResponse(BaseModel):
    id: uuid.UUID
    agent_id: uuid.UUID
    environment: str
    version_tag: str
    deployed_at: datetime
    status: str

    class Config:
        from_attributes = True

@router.get("/{agent_id}", response_model=List[DeploymentResponse])
async def get_deployment_history(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DeploymentHistory)
        .where(DeploymentHistory.agent_id == agent_id)
        .order_by(desc(DeploymentHistory.deployed_at))
    )
    return result.scalars().all()
