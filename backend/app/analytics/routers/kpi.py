from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant
from app.analytics.services.kpi_engine import calculate_current_kpis

router = APIRouter()

@router.get("")
async def get_kpis(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    return await calculate_current_kpis(str(ctx.client_id), db)
