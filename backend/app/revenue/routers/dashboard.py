from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant
from app.revenue.services.dashboard_service import get_dashboard_metrics
from app.revenue.services.treatment_analyzer import get_high_priority_opportunities

router = APIRouter()

@router.get("/metrics")
async def get_metrics(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Get high-level revenue dashboard metrics."""
    metrics = await get_dashboard_metrics(str(ctx.client_id), db)
    return metrics

@router.get("/pipeline")
async def get_pipeline(
    limit: int = 10,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Get the highest value open treatment opportunities."""
    opportunities = await get_high_priority_opportunities(str(ctx.client_id), db, limit)
    return opportunities
