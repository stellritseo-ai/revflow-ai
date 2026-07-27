import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.ai_studio.services.prompt_service import PromptService

router = APIRouter(prefix="/prompts", tags=["AI Studio Prompts"])

class PromptTemplateResponse(BaseModel):
    id: uuid.UUID
    agent_id: uuid.UUID
    name: str
    base_system_prompt: str
    variables: list

    class Config:
        from_attributes = True

class PromptVersionResponse(BaseModel):
    id: uuid.UUID
    template_id: uuid.UUID
    version_number: int
    content: str
    status: str
    author_id: str | None

    class Config:
        from_attributes = True

@router.get("/templates/{agent_id}", response_model=List[PromptTemplateResponse])
async def get_prompt_templates(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    templates = await PromptService.get_templates(db, agent_id)
    return templates

@router.get("/versions/{template_id}", response_model=List[PromptVersionResponse])
async def get_prompt_versions(template_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    versions = await PromptService.get_versions(db, template_id)
    return versions
