from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant

router = APIRouter()

@router.get("")
async def get_reports(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    """
    Mock endpoint to get saved reports.
    """
    return [
        {"id": "1", "name": "Monthly Revenue by Provider"},
        {"id": "2", "name": "Weekly New Patients"}
    ]
