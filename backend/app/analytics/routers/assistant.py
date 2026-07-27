from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant
from app.analytics.services.ai_insights import ask_executive_assistant

router = APIRouter()

class AssistantQuery(BaseModel):
    query: str

@router.post("/ask")
async def ask_assistant(
    request: AssistantQuery,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    """
    Query the AI Executive Assistant.
    """
    return await ask_executive_assistant(str(ctx.client_id), request.query)
