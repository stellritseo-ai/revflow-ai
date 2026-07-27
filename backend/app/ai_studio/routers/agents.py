import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.ai_studio.models.studio import AgentType
from app.ai_studio.services.agent_service import AgentService

router = APIRouter(prefix="/agents", tags=["AI Studio Agents"])

class AgentCreate(BaseModel):
    client_id: uuid.UUID
    name: str
    agent_type: AgentType = AgentType.RECEPTIONIST
    description: Optional[str] = None

class AgentResponse(BaseModel):
    id: uuid.UUID
    client_id: Optional[uuid.UUID]
    name: str
    agent_type: str
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

@router.get("/{client_id}", response_model=List[AgentResponse])
async def get_agents(client_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    agents = await AgentService.get_agents(db, client_id)
    return agents

@router.post("/", response_model=AgentResponse)
async def create_agent(req: AgentCreate, db: AsyncSession = Depends(get_db)):
    agent = await AgentService.create_agent(
        db, 
        client_id=req.client_id, 
        name=req.name, 
        agent_type=req.agent_type, 
        description=req.description
    )
    return agent
