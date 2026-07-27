import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.ai_studio.services.simulator_service import SimulatorService

router = APIRouter(prefix="/simulator", tags=["AI Studio Simulator"])

class SimulateRequest(BaseModel):
    agent_id: uuid.UUID
    input_text: str
    scenario_type: str = "chat"

class SimulateResponse(BaseModel):
    id: uuid.UUID
    output_text: str
    latency_ms: int
    confidence_score: float
    execution_trace: dict

    class Config:
        from_attributes = True

@router.post("/run", response_model=SimulateResponse)
async def run_simulation(req: SimulateRequest, db: AsyncSession = Depends(get_db)):
    session = await SimulatorService.simulate_conversation(
        db, 
        agent_id=req.agent_id, 
        input_text=req.input_text, 
        scenario_type=req.scenario_type
    )
    return session
