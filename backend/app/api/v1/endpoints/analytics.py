from typing import Dict, List, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant
from app.services import analytics_service

router = APIRouter()
logger = structlog.get_logger()

class DashboardAnalyticsResponse(Any):
    pass

@router.get("/dashboard")
async def get_dashboard_analytics(
    days: int = Query(default=30, ge=1, le=365),
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    """
    Get full analytics report for the current tenant clinic, including:
    - KPIs (Total missed calls, recovery rate, total appointments, total revenue)
    - Revenue Breakdown by Treatment Type
    - Revenue Breakdown by Provider
    - Daily Revenue / Booking Trends over the last N days
    """
    client_id = str(ctx.client_id)
    
    kpis = await analytics_service.get_tenant_kpis(client_id, db, days)
    treatments = await analytics_service.get_revenue_by_treatment(client_id, db, days)
    providers = await analytics_service.get_revenue_by_provider(client_id, db, days)
    trends = await analytics_service.get_revenue_trends(client_id, db, days)

    return {
        "kpis": kpis,
        "treatments": treatments,
        "providers": providers,
        "trends": trends
    }
