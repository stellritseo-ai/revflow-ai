import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.ai_studio.models.studio import AIWorkflow, WorkflowNode, WorkflowEdge

class WorkflowService:
    @staticmethod
    async def get_workflows(db: AsyncSession, agent_id: uuid.UUID) -> List[AIWorkflow]:
        result = await db.execute(
            select(AIWorkflow).where(AIWorkflow.agent_id == agent_id)
        )
        return result.scalars().all()

    @staticmethod
    async def save_workflow_graph(
        db: AsyncSession, 
        agent_id: uuid.UUID, 
        name: str, 
        layout_data: dict
    ) -> AIWorkflow:
        # Simplified for now, just saves the layout JSON
        workflow = AIWorkflow(
            agent_id=agent_id,
            name=name,
            layout_data=layout_data
        )
        db.add(workflow)
        await db.commit()
        await db.refresh(workflow)
        return workflow
