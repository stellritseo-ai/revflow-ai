import uuid
import random
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_studio.models.studio import TestingSession

class SimulatorService:
    @staticmethod
    async def simulate_conversation(
        db: AsyncSession, 
        agent_id: uuid.UUID, 
        input_text: str, 
        scenario_type: str = "chat"
    ) -> TestingSession:
        
        # Mock logic for now to simulate an AI answering back based on a testing scenario
        output_text = f"Simulated response to: '{input_text}'. Confidence is high."
        
        session = TestingSession(
            agent_id=agent_id,
            scenario_type=scenario_type,
            input_text=input_text,
            output_text=output_text,
            latency_ms=random.randint(400, 1200),
            confidence_score=random.uniform(0.8, 0.99),
            execution_trace={
                "tools_used": ["search_appointment"],
                "knowledge_retrieved": ["cancellation_policy.pdf"]
            }
        )
        
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session
