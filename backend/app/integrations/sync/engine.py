"""
Sync Engine — State machine for executing PMS sync jobs.
Tracks transitions: QUEUED → RUNNING → COMPLETED | FAILED | CANCELLED
Handles incremental vs. full sync, timing, and logging.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Optional
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.models import (
    IntegrationCredential,
    IntegrationSyncJob,
    IntegrationSyncLog,
    IntegrationError,
    SyncJobStatus,
    SyncType,
    SyncModule,
    PMSProvider,
)
from app.integrations.services.integration_manager import get_provider_instance

logger = structlog.get_logger()


async def create_sync_job(
    client_id: str,
    credential: IntegrationCredential,
    sync_type: SyncType,
    module: SyncModule,
    triggered_by: str,
    db: AsyncSession,
) -> IntegrationSyncJob:
    """Create and persist a new sync job in QUEUED status."""
    job = IntegrationSyncJob(
        id=str(uuid.uuid4()),
        client_id=client_id,
        credential_id=credential.id,
        provider=credential.provider,
        sync_type=sync_type,
        module=module,
        status=SyncJobStatus.QUEUED,
        triggered_by=triggered_by,
    )
    db.add(job)
    await db.flush()
    await db.commit()
    return job


async def run_sync_job(
    job: IntegrationSyncJob,
    credential: IntegrationCredential,
    db: AsyncSession,
    since: Optional[str] = None,
) -> IntegrationSyncJob:
    """
    Execute a sync job against the PMS provider.
    Updates job status through the state machine.
    """
    log_entries = []

    async def add_log(level: str, message: str, module: str, record_id: Optional[str] = None, details: Optional[dict] = None):
        entry = IntegrationSyncLog(
            id=str(uuid.uuid4()),
            client_id=job.client_id,
            job_id=job.id,
            level=level,
            module=module,
            message=message,
            record_id=record_id,
            details=details,
        )
        db.add(entry)

    # Transition: QUEUED → RUNNING
    job.status = SyncJobStatus.RUNNING
    job.started_at = datetime.now(timezone.utc)
    await db.flush()

    provider = get_provider_instance(credential)

    try:
        # Test connection first
        conn_result = await provider.test_connection()
        if not conn_result["success"]:
            raise ConnectionError(f"Connection test failed: {conn_result['message']}")

        await add_log("info", f"Connected to {credential.provider.value} ({conn_result['latency_ms']}ms)", "connection")

        # Determine which modules to sync
        modules_to_sync = []
        if job.module == SyncModule.ALL:
            modules_to_sync = [
                SyncModule.PATIENTS,
                SyncModule.APPOINTMENTS,
                SyncModule.PROVIDERS,
                SyncModule.INSURANCE,
            ]
        else:
            modules_to_sync = [job.module]

        total_processed = 0
        total_created = 0
        total_updated = 0
        total_errors = 0
        total_warnings = 0

        for mod in modules_to_sync:
            await add_log("info", f"Starting {mod.value} sync", mod.value)
            try:
                if mod == SyncModule.PATIENTS:
                    result = await provider.sync_patients(since=since)
                elif mod == SyncModule.APPOINTMENTS:
                    result = await provider.sync_appointments(since=since)
                elif mod == SyncModule.PROVIDERS:
                    result = await provider.sync_providers()
                elif mod == SyncModule.INSURANCE:
                    result = await provider.sync_insurance()
                elif mod == SyncModule.PROCEDURES:
                    result = await provider.sync_procedures()
                elif mod == SyncModule.SCHEDULES:
                    result = await provider.sync_schedule()
                else:
                    continue

                total_processed += result.records_processed
                total_created += result.records_created
                total_updated += result.records_updated
                total_errors += len(result.errors)
                total_warnings += len(result.warnings)

                if result.success:
                    await add_log(
                        "info",
                        f"{mod.value}: {result.records_processed} processed, {result.records_created} created",
                        mod.value,
                    )
                else:
                    await add_log("error", f"{mod.value} sync failed: {result.error_message}", mod.value)

                # Log individual errors
                for err in result.errors:
                    error_record = IntegrationError(
                        id=str(uuid.uuid4()),
                        client_id=job.client_id,
                        job_id=job.id,
                        error_type=err.get("error_type", "unknown"),
                        error_message=err.get("message", ""),
                        record_id=err.get("record_id"),
                        module=mod.value,
                    )
                    db.add(error_record)

            except Exception as module_err:
                await add_log("error", f"{mod.value} exception: {str(module_err)}", mod.value)
                total_errors += 1

        # Transition: RUNNING → COMPLETED
        completed_at = datetime.now(timezone.utc)
        duration = (completed_at - job.started_at).total_seconds()

        job.status = SyncJobStatus.COMPLETED
        job.completed_at = completed_at
        job.duration_seconds = duration
        job.records_synced = total_processed
        job.records_created = total_created
        job.records_updated = total_updated
        job.errors_count = total_errors
        job.warnings_count = total_warnings

        await add_log(
            "info",
            f"Sync completed in {duration:.1f}s — {total_processed} records, {total_errors} errors",
            "engine",
        )

    except Exception as e:
        # Transition: RUNNING → FAILED
        logger.error("Sync job failed", job_id=job.id, error=str(e))
        job.status = SyncJobStatus.FAILED
        job.completed_at = datetime.now(timezone.utc)
        job.error_message = str(e)
        if job.started_at:
            job.duration_seconds = (job.completed_at - job.started_at).total_seconds()

        await add_log("error", f"Job failed: {str(e)}", "engine")

    await db.flush()
    await db.commit()
    return job
