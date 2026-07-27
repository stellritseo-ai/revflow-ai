import uuid
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.models import Call, CallStatus, Appointment, AppointmentStatus

logger = structlog.get_logger()

async def get_tenant_kpis(
    client_id: str,
    db: AsyncSession,
    days: int = 30
) -> Dict:
    """
    Computes key performance indicators for the tenant over the specified past number of days.
    """
    client_uuid = uuid.UUID(client_id)
    since_date = datetime.utcnow() - timedelta(days=days)

    # 1. Total Calls
    total_calls_stmt = select(func.count(Call.id)).where(
        Call.client_id == client_uuid,
        Call.created_at >= since_date
    )
    total_calls_res = await db.execute(total_calls_stmt)
    total_calls = total_calls_res.scalar() or 0

    # 2. Status Counts
    status_counts_stmt = select(Call.status, func.count(Call.id)).where(
        Call.client_id == client_uuid,
        Call.created_at >= since_date
    ).group_by(Call.status)
    status_counts_res = await db.execute(status_counts_stmt)
    status_counts = {status.value: count for status, count in status_counts_res.all()}

    # Ensure all statuses exist
    for status_val in CallStatus:
        if status_val.value not in status_counts:
            status_counts[status_val.value] = 0

    # 3. Total Revenue Recovered (From completed or scheduled appointments linked to calls)
    revenue_stmt = select(func.sum(Appointment.revenue_amount)).where(
        Appointment.client_id == client_uuid,
        Appointment.status != AppointmentStatus.CANCELLED,
        Appointment.created_at >= since_date
    )
    revenue_res = await db.execute(revenue_stmt)
    total_revenue = float(revenue_res.scalar() or 0.0)

    # 4. Total Booked Appointments
    total_appts_stmt = select(func.count(Appointment.id)).where(
        Appointment.client_id == client_uuid,
        Appointment.status != AppointmentStatus.CANCELLED,
        Appointment.created_at >= since_date
    )
    total_appts_res = await db.execute(total_appts_stmt)
    total_appointments = total_appts_res.scalar() or 0

    # 5. Recovery Rate
    recovery_rate = 0.0
    if total_calls > 0:
        recovered = status_counts.get(CallStatus.RECOVERED.value, 0)
        recovery_rate = round((recovered / total_calls) * 100, 1)

    return {
        "days": days,
        "total_calls": total_calls,
        "status_counts": status_counts,
        "total_revenue": total_revenue,
        "total_appointments": total_appointments,
        "recovery_rate": recovery_rate
    }

async def get_revenue_by_treatment(
    client_id: str,
    db: AsyncSession,
    days: int = 30
) -> List[Dict]:
    """
    Retrieves revenue group by treatment type for the tenant.
    """
    client_uuid = uuid.UUID(client_id)
    since_date = datetime.utcnow() - timedelta(days=days)

    stmt = select(
        Appointment.treatment_type,
        func.count(Appointment.id).label("count"),
        func.sum(Appointment.revenue_amount).label("revenue")
    ).where(
        Appointment.client_id == client_uuid,
        Appointment.status != AppointmentStatus.CANCELLED,
        Appointment.created_at >= since_date
    ).group_by(Appointment.treatment_type).order_by(desc("revenue"))

    res = await db.execute(stmt)
    data = []
    for row in res.all():
        data.append({
            "treatment": row[0] or "Unknown",
            "bookings": row[1],
            "revenue": float(row[2] or 0.0)
        })
    return data

async def get_revenue_by_provider(
    client_id: str,
    db: AsyncSession,
    days: int = 30
) -> List[Dict]:
    """
    Retrieves revenue group by provider name for the tenant.
    """
    client_uuid = uuid.UUID(client_id)
    since_date = datetime.utcnow() - timedelta(days=days)

    stmt = select(
        Appointment.provider_name,
        func.count(Appointment.id).label("count"),
        func.sum(Appointment.revenue_amount).label("revenue")
    ).where(
        Appointment.client_id == client_uuid,
        Appointment.status != AppointmentStatus.CANCELLED,
        Appointment.created_at >= since_date
    ).group_by(Appointment.provider_name).order_by(desc("revenue"))

    res = await db.execute(stmt)
    data = []
    for row in res.all():
        data.append({
            "provider": row[0] or "Unknown",
            "bookings": row[1],
            "revenue": float(row[2] or 0.0)
        })
    return data

async def get_revenue_trends(
    client_id: str,
    db: AsyncSession,
    days: int = 30
) -> List[Dict]:
    """
    Retrieves daily revenue trends for the tenant.
    """
    client_uuid = uuid.UUID(client_id)
    since_date = datetime.utcnow() - timedelta(days=days)

    # Cast to date for grouping
    stmt = select(
        func.date_trunc('day', Appointment.created_at).label("day"),
        func.sum(Appointment.revenue_amount).label("revenue"),
        func.count(Appointment.id).label("count")
    ).where(
        Appointment.client_id == client_uuid,
        Appointment.status != AppointmentStatus.CANCELLED,
        Appointment.created_at >= since_date
    ).group_by("day").order_by("day")

    res = await db.execute(stmt)
    data = []
    for row in res.all():
        data.append({
            "date": row[0].strftime("%Y-%m-%d") if row[0] else "",
            "revenue": float(row[1] or 0.0),
            "bookings": row[2]
        })

    # Fill in missing dates with zero revenue to make a smooth chart
    trend_dict = {item["date"]: item for item in data if item["date"]}
    complete_trend = []
    start_date = datetime.utcnow().date() - timedelta(days=days-1)
    
    for i in range(days):
        current_date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        if current_date in trend_dict:
            complete_trend.append(trend_dict[current_date])
        else:
            complete_trend.append({
                "date": current_date,
                "revenue": 0.0,
                "bookings": 0
            })
            
    return complete_trend
