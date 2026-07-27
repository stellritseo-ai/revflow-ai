from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from datetime import date
import uuid

from app.revenue.models import (
    TreatmentOpportunity,
    TreatmentOpportunityStatus,
    PatientProfile
)

async def calculate_open_treatment_value(client_id: str, db: AsyncSession) -> float:
    """
    Calculates the total value of all OPEN treatment opportunities for a clinic.
    """
    stmt = select(func.sum(TreatmentOpportunity.estimated_value)).where(
        and_(
            TreatmentOpportunity.client_id == uuid.UUID(client_id),
            TreatmentOpportunity.status == TreatmentOpportunityStatus.OPEN
        )
    )
    total = (await db.execute(stmt)).scalar()
    return float(total) if total else 0.0

async def get_high_priority_opportunities(client_id: str, db: AsyncSession, limit: int = 10):
    """
    Fetches the highest value open treatment plans.
    """
    stmt = select(TreatmentOpportunity, PatientProfile).join(
        PatientProfile, TreatmentOpportunity.patient_id == PatientProfile.id
    ).where(
        and_(
            TreatmentOpportunity.client_id == uuid.UUID(client_id),
            TreatmentOpportunity.status == TreatmentOpportunityStatus.OPEN
        )
    ).order_by(TreatmentOpportunity.estimated_value.desc()).limit(limit)
    
    results = (await db.execute(stmt)).all()
    
    opportunities = []
    for opp, patient in results:
        opportunities.append({
            "id": str(opp.id),
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "description": opp.description,
            "estimated_value": opp.estimated_value,
            "priority": opp.priority.value,
            "date_identified": opp.date_identified.isoformat()
        })
        
    return opportunities
