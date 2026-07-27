from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date
from typing import List
import uuid

from app.revenue.models import (
    PatientProfile,
    RecallRule,
    RevenueTask,
    RevenueTaskType,
    RevenueTaskStatus
)

async def scan_for_overdue_recalls(client_id: str, db: AsyncSession) -> List[RevenueTask]:
    """
    Scans patients whose next_recall_due is today or in the past,
    and creates a RevenueTask if one does not already exist.
    """
    today = date.today()
    
    # Find patients due for recall
    stmt = select(PatientProfile).where(
        and_(
            PatientProfile.client_id == uuid.UUID(client_id),
            PatientProfile.next_recall_due <= today
        )
    )
    patients = (await db.execute(stmt)).scalars().all()
    
    tasks_created = []
    
    for patient in patients:
        # Check if an active recall task already exists for this patient
        task_stmt = select(RevenueTask).where(
            and_(
                RevenueTask.client_id == uuid.UUID(client_id),
                RevenueTask.patient_id == patient.id,
                RevenueTask.task_type == RevenueTaskType.RECALL,
                RevenueTask.status.in_([RevenueTaskStatus.PENDING, RevenueTaskStatus.IN_PROGRESS])
            )
        )
        existing_task = (await db.execute(task_stmt)).scalar_one_or_none()
        
        if not existing_task:
            # Create a new recall task
            new_task = RevenueTask(
                client_id=uuid.UUID(client_id),
                patient_id=patient.id,
                title=f"Recall Due: {patient.first_name} {patient.last_name}",
                description="Patient is due for their regular recall appointment.",
                task_type=RevenueTaskType.RECALL,
                status=RevenueTaskStatus.PENDING,
                priority="high",
                assigned_role="Receptionist",
                due_date=today
            )
            db.add(new_task)
            tasks_created.append(new_task)
            
    if tasks_created:
        await db.commit()
        
    return tasks_created
