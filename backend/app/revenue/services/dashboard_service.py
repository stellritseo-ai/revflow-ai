from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
import uuid

from app.revenue.models import (
    PatientProfile,
    TreatmentOpportunity,
    TreatmentOpportunityStatus,
    RevenueTask,
    RevenueTaskStatus
)
from app.models.models import Appointment, AppointmentStatus

async def get_dashboard_metrics(client_id: str, db: AsyncSession) -> dict:
    """
    Aggregates top-level metrics for the Revenue Dashboard.
    """
    client_uuid = uuid.UUID(client_id)
    
    # 1. Total Open Treatment Value
    stmt_open_tx = select(func.sum(TreatmentOpportunity.estimated_value)).where(
        and_(
            TreatmentOpportunity.client_id == client_uuid,
            TreatmentOpportunity.status == TreatmentOpportunityStatus.OPEN
        )
    )
    open_tx_value = (await db.execute(stmt_open_tx)).scalar() or 0.0
    
    # 2. Patients Due for Recall (Count of pending recall tasks)
    stmt_recall = select(func.count(RevenueTask.id)).where(
        and_(
            RevenueTask.client_id == client_uuid,
            RevenueTask.task_type == "recall",
            RevenueTask.status == RevenueTaskStatus.PENDING
        )
    )
    patients_due_recall = (await db.execute(stmt_recall)).scalar() or 0
    
    # 3. Missed Appointments (No Shows in the last 30 days - simulated by looking at Appointment model)
    stmt_missed = select(func.count(Appointment.id)).where(
        and_(
            Appointment.client_id == client_uuid,
            Appointment.status == AppointmentStatus.NO_SHOW
        )
    )
    missed_appointments = (await db.execute(stmt_missed)).scalar() or 0
    
    # 4. Total Recovered Revenue (sum of estimated_revenue on completed tasks)
    stmt_recovered = select(func.sum(RevenueTask.estimated_revenue)).where(
        and_(
            RevenueTask.client_id == client_uuid,
            RevenueTask.status == RevenueTaskStatus.COMPLETED
        )
    )
    recovered_revenue = (await db.execute(stmt_recovered)).scalar() or 0.0
    
    return {
        "open_treatment_value": float(open_tx_value),
        "patients_due_recall": patients_due_recall,
        "missed_appointments": missed_appointments,
        "recovered_revenue": float(recovered_revenue),
        "no_show_rate": 4.2, # Mock percentage for now
        "cancellation_rate": 8.5 # Mock percentage for now
    }
