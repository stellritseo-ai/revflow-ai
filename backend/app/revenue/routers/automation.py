from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant
from app.revenue.models import AutomationRule, RecallRule

router = APIRouter()

@router.get("/rules")
async def get_automation_rules(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AutomationRule).where(
        AutomationRule.client_id == ctx.client_id
    )
    rules = (await db.execute(stmt)).scalars().all()
    
    return [{
        "id": str(r.id),
        "name": r.name,
        "event_trigger": r.event_trigger.value,
        "action": r.action.value,
        "is_active": r.is_active
    } for r in rules]

@router.get("/recall-rules")
async def get_recall_rules(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(RecallRule).where(
        RecallRule.client_id == ctx.client_id
    )
    rules = (await db.execute(stmt)).scalars().all()
    
    return [{
        "id": str(r.id),
        "name": r.name,
        "interval_months": r.interval_months,
        "is_active": r.is_active
    } for r in rules]
