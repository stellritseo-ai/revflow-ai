from datetime import date
import logging
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.analytics.services.event_bus import bus
from app.analytics.models import AnalyticsSnapshot, PeriodType
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

async def handle_appointment_completed(payload: dict):
    """
    Handles APPOINTMENT_COMPLETED events and increments daily revenue and counts.
    """
    client_id = payload.get("client_id")
    revenue = payload.get("revenue", 0.0)
    
    if not client_id:
        return
        
    today = date.today()
    
    async with SessionLocal() as db:
        # Find or create daily snapshot
        stmt = select(AnalyticsSnapshot).where(
            and_(
                AnalyticsSnapshot.client_id == uuid.UUID(client_id),
                AnalyticsSnapshot.period_date == today,
                AnalyticsSnapshot.period_type == PeriodType.DAILY
            )
        )
        snapshot = (await db.execute(stmt)).scalar_one_or_none()
        
        if not snapshot:
            snapshot = AnalyticsSnapshot(
                client_id=uuid.UUID(client_id),
                period_type=PeriodType.DAILY,
                period_date=today,
                metrics={
                    "total_revenue": 0.0,
                    "appointments_completed": 0,
                    "new_patients": 0
                }
            )
            db.add(snapshot)
            
        # Update metrics (using a copy to trigger SQLAlchemy change tracking on JSON)
        metrics = dict(snapshot.metrics)
        metrics["total_revenue"] = metrics.get("total_revenue", 0.0) + revenue
        metrics["appointments_completed"] = metrics.get("appointments_completed", 0) + 1
        snapshot.metrics = metrics
        
        await db.commit()
        logger.info(f"Updated AnalyticsSnapshot for client {client_id} on {today}")

def register_analytics_subscribers():
    """Register all analytics handlers to the event bus."""
    bus.subscribe("APPOINTMENT_COMPLETED", handle_appointment_completed)
    # bus.subscribe("PATIENT_CREATED", handle_new_patient)
    # bus.subscribe("CALL_ANSWERED", handle_call_answered)
