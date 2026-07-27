from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant, require_owner_or_admin
from app.models.models import Location

router = APIRouter()

# ─── Pydantic Schemas ───────────────────────────────────────────────────────

class LocationResponse(BaseModel):
    id: str
    location_name: str
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    zip_code: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    active: bool

    class Config:
        from_attributes = True

class LocationCreate(BaseModel):
    location_name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    active: bool = True

class LocationUpdate(BaseModel):
    location_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    active: Optional[bool] = None

# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("", response_model=List[LocationResponse])
async def list_locations(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists all locations for the current tenant.
    """
    stmt = select(Location).where(Location.client_id == ctx.client.id)
    result = await db.execute(stmt)
    locations = result.scalars().all()
    return locations

@router.post("", response_model=LocationResponse)
async def create_location(
    payload: LocationCreate,
    ctx: TenantContext = Depends(require_owner_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new location for the current tenant.
    """
    # Enforce max locations check here if desired
    location = Location(
        client_id=ctx.client.id,
        location_name=payload.location_name,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        zip_code=payload.zip_code,
        phone=payload.phone,
        email=payload.email,
        active=payload.active
    )
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location

@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: str,
    payload: LocationUpdate,
    ctx: TenantContext = Depends(require_owner_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates an existing location.
    """
    stmt = select(Location).where(
        Location.id == uuid.UUID(location_id),
        Location.client_id == ctx.client.id
    )
    result = await db.execute(stmt)
    location = result.scalar_one_or_none()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)

    await db.commit()
    await db.refresh(location)
    return location

@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: str,
    ctx: TenantContext = Depends(require_owner_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Deletes a location.
    """
    stmt = select(Location).where(
        Location.id == uuid.UUID(location_id),
        Location.client_id == ctx.client.id
    )
    result = await db.execute(stmt)
    location = result.scalar_one_or_none()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    await db.delete(location)
    await db.commit()
