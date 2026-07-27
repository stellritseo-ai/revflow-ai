import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.ai_studio.models.studio import StudioPromptTemplate, StudioPromptVersion

class PromptService:
    @staticmethod
    async def get_templates(db: AsyncSession, agent_id: uuid.UUID) -> List[StudioPromptTemplate]:
        result = await db.execute(
            select(StudioPromptTemplate).where(StudioPromptTemplate.agent_id == agent_id)
        )
        return result.scalars().all()

    @staticmethod
    async def get_versions(db: AsyncSession, template_id: uuid.UUID) -> List[StudioPromptVersion]:
        result = await db.execute(
            select(StudioPromptVersion)
            .where(StudioPromptVersion.template_id == template_id)
            .order_by(desc(StudioPromptVersion.version_number))
        )
        return result.scalars().all()
