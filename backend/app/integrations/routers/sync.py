"""
Sync Router — Manual sync triggers, job status, retry operations.
"""
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.integrations.models import (
    IntegrationCredential, IntegrationSyncJob,
    SyncType, SyncModule, SyncJobStatus
)
from app.integrations.sync.engine import create_sync_job, run_sync_job

router = APIRouter(prefix="/integrations", tags=["Integration Sync"])


class ManualSyncRequest(BaseModel):
    credential_id: str
    module: str = "all"
    since: Optional[str] = None


class SyncJobResponse(BaseModel):
    id: str
    provider: str
    sync_type: str
    module: str
    status: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_seconds: Optional[float] = None
    records_synced: int = 0
    records_created: int = 0
    records_updated: int = 0
    errors_count: int = 0
    warnings_count: int = 0
    error_message: Optional[str] = None
    triggered_by: str
    created_at: str

    class Config:
        from_attributes = True


async def _run_sync_background(job_id: str, credential_id: str, since: Optional[str]):
    """Background task to run a sync job."""
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        job_result = await db.execute(
            select(IntegrationSyncJob).where(IntegrationSyncJob.id == job_id)
        )
        job = job_result.scalar_one_or_none()
        cred_result = await db.execute(
            select(IntegrationCredential).where(IntegrationCredential.id == credential_id)
        )
        cred = cred_result.scalar_one_or_none()
        if job and cred:
            await run_sync_job(job, cred, db, since=since)


@router.post("/sync/trigger")
async def trigger_manual_sync(
    payload: ManualSyncRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a manual sync against a connected PMS provider."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    # Verify credential belongs to this clinic
    cred_result = await db.execute(
        select(IntegrationCredential).where(
            IntegrationCredential.id == payload.credential_id,
            IntegrationCredential.client_id == str(current_user.client_id),
            IntegrationCredential.is_active == True,
        )
    )
    cred = cred_result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Active credential not found")

    try:
        module = SyncModule(payload.module)
    except ValueError:
        module = SyncModule.ALL

    # Create queued job
    job = await create_sync_job(
        client_id=str(current_user.client_id),
        credential=cred,
        sync_type=SyncType.MANUAL,
        module=module,
        triggered_by=str(current_user.id) if hasattr(current_user, "id") else "user",
        db=db,
    )

    # Run async in background
    background_tasks.add_task(_run_sync_background, job.id, cred.id, payload.since)

    return {
        "success": True,
        "job_id": job.id,
        "status": "queued",
        "message": f"Sync job queued for {cred.provider.value}",
    }


@router.get("/sync/jobs", response_model=List[SyncJobResponse])
async def list_sync_jobs(
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List recent sync jobs for this clinic."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    query = select(IntegrationSyncJob).where(
        IntegrationSyncJob.client_id == str(current_user.client_id)
    ).order_by(IntegrationSyncJob.created_at.desc()).limit(limit)

    if status:
        try:
            query = query.where(IntegrationSyncJob.status == SyncJobStatus(status))
        except ValueError:
            pass

    result = await db.execute(query)
    jobs = result.scalars().all()

    return [SyncJobResponse(
        id=j.id,
        provider=j.provider.value,
        sync_type=j.sync_type.value,
        module=j.module.value,
        status=j.status.value,
        started_at=str(j.started_at) if j.started_at else None,
        completed_at=str(j.completed_at) if j.completed_at else None,
        duration_seconds=j.duration_seconds,
        records_synced=j.records_synced,
        records_created=j.records_created,
        records_updated=j.records_updated,
        errors_count=j.errors_count,
        warnings_count=j.warnings_count,
        error_message=j.error_message,
        triggered_by=j.triggered_by,
        created_at=str(j.created_at),
    ) for j in jobs]


@router.get("/sync/jobs/{job_id}")
async def get_sync_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the status and results of a specific sync job."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(IntegrationSyncJob).where(
            IntegrationSyncJob.id == job_id,
            IntegrationSyncJob.client_id == str(current_user.client_id),
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Sync job not found")

    return SyncJobResponse(
        id=job.id,
        provider=job.provider.value,
        sync_type=job.sync_type.value,
        module=job.module.value,
        status=job.status.value,
        started_at=str(job.started_at) if job.started_at else None,
        completed_at=str(job.completed_at) if job.completed_at else None,
        duration_seconds=job.duration_seconds,
        records_synced=job.records_synced,
        records_created=job.records_created,
        records_updated=job.records_updated,
        errors_count=job.errors_count,
        warnings_count=job.warnings_count,
        error_message=job.error_message,
        triggered_by=job.triggered_by,
        created_at=str(job.created_at),
    )


@router.post("/sync/jobs/{job_id}/retry")
async def retry_failed_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retry a failed sync job."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    job_result = await db.execute(
        select(IntegrationSyncJob).where(
            IntegrationSyncJob.id == job_id,
            IntegrationSyncJob.client_id == str(current_user.client_id),
            IntegrationSyncJob.status == SyncJobStatus.FAILED,
        )
    )
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Failed job not found")

    # Reset job for retry
    job.status = SyncJobStatus.QUEUED
    job.retry_count += 1
    job.error_message = None
    await db.commit()

    cred_result = await db.execute(
        select(IntegrationCredential).where(IntegrationCredential.id == job.credential_id)
    )
    cred = cred_result.scalar_one_or_none()

    if cred:
        background_tasks.add_task(_run_sync_background, job.id, cred.id, None)

    return {"success": True, "job_id": job.id, "status": "queued_for_retry"}
