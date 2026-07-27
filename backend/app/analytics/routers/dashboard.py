from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant

router = APIRouter()

@router.get("/snapshots/daily")
async def get_daily_snapshots(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    """
    Mock endpoint to get daily snapshots for the trend charts.
    """
    return [
        {"date": "2023-11-01", "revenue": 4500, "appointments": 12},
        {"date": "2023-11-02", "revenue": 5200, "appointments": 14},
        {"date": "2023-11-03", "revenue": 4800, "appointments": 13},
        {"date": "2023-11-04", "revenue": 6100, "appointments": 16},
        {"date": "2023-11-05", "revenue": 5900, "appointments": 15},
        {"date": "2023-11-06", "revenue": 3200, "appointments": 8},
        {"date": "2023-11-07", "revenue": 7500, "appointments": 18},
    ]
