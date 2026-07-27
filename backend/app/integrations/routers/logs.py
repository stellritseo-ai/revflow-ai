"""
Sync Logs Router — Query sync log entries and integration errors.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.integrations.models import IntegrationSyncLog, IntegrationError

router = APIRouter(prefix="/integrations", tags=["Integration Logs"])


class LogEntryResponse(BaseModel):
    id: str
    job_id: str
    level: str
    module: str
    message: str
    record_id: Optional[str] = None
    created_at: str


class ErrorResponse(BaseModel):
    id: str
    job_id: str
    error_type: str
    error_message: str
    record_id: Optional[str] = None
    module: Optional[str] = None
    is_retried: bool
    retry_count: int
    resolved: bool
    created_at: str


@router.get("/logs", response_model=List[LogEntryResponse])
async def get_sync_logs(
    job_id: Optional[str] = None,
    level: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get sync log entries for this clinic."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    query = select(IntegrationSyncLog).where(
        IntegrationSyncLog.client_id == str(current_user.client_id)
    ).order_by(IntegrationSyncLog.created_at.desc()).limit(limit)

    if job_id:
        query = query.where(IntegrationSyncLog.job_id == job_id)
    if level:
        query = query.where(IntegrationSyncLog.level == level)

    result = await db.execute(query)
    logs = result.scalars().all()

    return [LogEntryResponse(
        id=l.id,
        job_id=l.job_id,
        level=l.level,
        module=l.module,
        message=l.message,
        record_id=l.record_id,
        created_at=str(l.created_at),
    ) for l in logs]


@router.get("/errors", response_model=List[ErrorResponse])
async def get_sync_errors(
    job_id: Optional[str] = None,
    resolved: Optional[bool] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get sync errors for this clinic."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    query = select(IntegrationError).where(
        IntegrationError.client_id == str(current_user.client_id)
    ).order_by(IntegrationError.created_at.desc()).limit(limit)

    if job_id:
        query = query.where(IntegrationError.job_id == job_id)
    if resolved is not None:
        query = query.where(IntegrationError.resolved == resolved)

    result = await db.execute(query)
    errors = result.scalars().all()

    return [ErrorResponse(
        id=e.id,
        job_id=e.job_id,
        error_type=e.error_type,
        error_message=e.error_message,
        record_id=e.record_id,
        module=e.module,
        is_retried=e.is_retried,
        retry_count=e.retry_count,
        resolved=e.resolved,
        created_at=str(e.created_at),
    ) for e in errors]


@router.patch("/errors/{error_id}/resolve")
async def resolve_error(
    error_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an error as resolved."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(IntegrationError).where(
            IntegrationError.id == error_id,
            IntegrationError.client_id == str(current_user.client_id),
        )
    )
    error = result.scalar_one_or_none()
    if not error:
        raise HTTPException(status_code=404, detail="Error not found")

    error.resolved = True
    await db.commit()
    return {"success": True}
