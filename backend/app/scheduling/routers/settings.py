from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from sqlalchemy import select

from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant
from app.scheduling.models import Operatory, Waitlist, WaitlistStatus, TimeBlock

router = APIRouter()

class OperatoryCreate(BaseModel):
    name: str
    type: str = "chair"
    is_active: bool = True

class OperatoryResponse(BaseModel):
    id: str
    name: str
    type: str
    is_active: bool

@router.get("/operatories", response_model=List[OperatoryResponse])
async def list_operatories(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Operatory).where(Operatory.client_id == ctx.client_id)
    ops = (await db.execute(stmt)).scalars().all()
    return [
        OperatoryResponse(id=str(op.id), name=op.name, type=op.type, is_active=op.is_active)
        for op in ops
    ]

@router.post("/operatories", response_model=OperatoryResponse)
async def create_operatory(
    payload: OperatoryCreate,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    op = Operatory(
        client_id=ctx.client_id,
        name=payload.name,
        type=payload.type,
        is_active=payload.is_active
    )
    db.add(op)
    await db.commit()
    await db.refresh(op)
    return OperatoryResponse(id=str(op.id), name=op.name, type=op.type, is_active=op.is_active)


class WaitlistCreate(BaseModel):
    patient_name: str
    patient_phone: str
    patient_email: Optional[str] = None
    treatment_type: Optional[str] = None
    preferred_days: Optional[List[int]] = None
    preferred_time_range: Optional[str] = None
    notes: Optional[str] = None

class WaitlistResponse(BaseModel):
    id: str
    patient_name: str
    patient_phone: str
    status: str

@router.get("/waitlist", response_model=List[WaitlistResponse])
async def list_waitlist(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Waitlist).where(Waitlist.client_id == ctx.client_id)
    entries = (await db.execute(stmt)).scalars().all()
    return [
        WaitlistResponse(id=str(w.id), patient_name=w.patient_name, patient_phone=w.patient_phone, status=w.status.value)
        for w in entries
    ]

@router.post("/waitlist", response_model=WaitlistResponse)
async def add_waitlist(
    payload: WaitlistCreate,
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db)
):
    entry = Waitlist(
        client_id=ctx.client_id,
        patient_name=payload.patient_name,
        patient_phone=payload.patient_phone,
        patient_email=payload.patient_email,
        treatment_type=payload.treatment_type,
        preferred_days=payload.preferred_days,
        preferred_time_range=payload.preferred_time_range,
        notes=payload.notes
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return WaitlistResponse(id=str(entry.id), patient_name=entry.patient_name, patient_phone=entry.patient_phone, status=entry.status.value)
