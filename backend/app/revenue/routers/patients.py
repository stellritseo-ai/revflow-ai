from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List

from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant
from app.revenue.models import PatientProfile

router = APIRouter()

@router.get("")
async def get_patients(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(PatientProfile).where(
        PatientProfile.client_id == ctx.client_id
    )
    patients = (await db.execute(stmt)).scalars().all()
    
    return [{
        "id": str(p.id),
        "name": f"{p.first_name} {p.last_name}",
        "phone": p.phone,
        "email": p.email,
        "last_visit_date": p.last_visit_date.isoformat() if p.last_visit_date else None,
        "next_recall_due": p.next_recall_due.isoformat() if p.next_recall_due else None,
        "churn_risk_score": p.churn_risk_score.value,
        "no_show_probability": p.no_show_probability,
        "total_revenue_generated": p.total_revenue_generated
    } for p in patients]
