import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.ai_studio.models.studio import AIAgent, AgentType

class AgentService:
    @staticmethod
    async def get_agents(db: AsyncSession, client_id: uuid.UUID) -> List[AIAgent]:
        result = await db.execute(
            select(AIAgent).where(AIAgent.client_id == client_id)
        )
        return result.scalars().all()

    @staticmethod
    async def create_agent(db: AsyncSession, client_id: uuid.UUID, name: str, agent_type: AgentType, description: Optional[str] = None) -> AIAgent:
        new_agent = AIAgent(
            client_id=client_id,
            name=name,
            agent_type=agent_type,
            description=description
        )
        db.add(new_agent)
        await db.commit()
        await db.refresh(new_agent)
        return new_agent
