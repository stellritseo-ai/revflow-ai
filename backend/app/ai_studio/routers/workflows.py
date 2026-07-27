import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.ai_studio.services.workflow_service import WorkflowService

router = APIRouter(prefix="/workflows", tags=["AI Studio Workflows"])

class WorkflowCreate(BaseModel):
    agent_id: uuid.UUID
    name: str
    layout_data: dict

class WorkflowResponse(BaseModel):
    id: uuid.UUID
    agent_id: uuid.UUID
    name: str
    version_tag: str
    is_published: bool
    layout_data: dict

    class Config:
        from_attributes = True

@router.get("/{agent_id}", response_model=List[WorkflowResponse])
async def get_workflows(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    workflows = await WorkflowService.get_workflows(db, agent_id)
    return workflows

@router.post("/", response_model=WorkflowResponse)
async def save_workflow(req: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    workflow = await WorkflowService.save_workflow_graph(
        db, 
        agent_id=req.agent_id, 
        name=req.name, 
        layout_data=req.layout_data
    )
    return workflow
