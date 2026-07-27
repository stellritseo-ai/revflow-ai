from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
import uuid

from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant
from app.revenue.models import RevenueTask, RevenueTaskStatus, PatientProfile

router = APIRouter()

@router.get("")
async def get_tasks(
    status: str = "pending",
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(RevenueTask, PatientProfile).outerjoin(
        PatientProfile, RevenueTask.patient_id == PatientProfile.id
    ).where(
        and_(
            RevenueTask.client_id == ctx.client_id,
            RevenueTask.status == RevenueTaskStatus(status)
        )
    ).order_by(RevenueTask.due_date)
    
    results = (await db.execute(stmt)).all()
    
    tasks = []
    for task, patient in results:
        tasks.append({
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "task_type": task.task_type.value,
            "status": task.status.value,
            "priority": task.priority,
            "due_date": task.due_date.isoformat(),
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else None,
            "estimated_revenue": task.estimated_revenue
        })
    return tasks

@router.patch("/{task_id}/resolve")
async def resolve_task(
    task_id: str,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(RevenueTask).where(
        and_(
            RevenueTask.client_id == ctx.client_id,
            RevenueTask.id == uuid.UUID(task_id)
        )
    )
    task = (await db.execute(stmt)).scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task.status = RevenueTaskStatus.COMPLETED
    await db.commit()
    return {"success": True, "message": "Task completed successfully"}
