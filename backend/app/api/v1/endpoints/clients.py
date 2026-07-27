from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import TenantContext, require_tenant, require_owner_or_admin
from app.models.models import Client, ClientSettings, User, PmsType

router = APIRouter()

# ─── Pydantic Schemas ───────────────────────────────────────────────────────

class ClientProfileResponse(BaseModel):
    id: str
    uuid: str
    clinic_name: str
    slug: str
    business_email: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    logo: Optional[str]
    timezone: str
    currency: str
    country: str
    address: Optional[str]
    specialty: Optional[str]
    subscription_plan: str
    subscription_status: str
    max_users: int
    max_locations: int
    active: bool
    pms_type: PmsType
    ai_enabled: bool

    class Config:
        from_attributes = True

class ClientProfileUpdate(BaseModel):
    clinic_name: Optional[str] = None
    business_email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    logo: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    specialty: Optional[str] = None
    pms_type: Optional[PmsType] = None
    ai_enabled: Optional[bool] = None

class ClientSettingsResponse(BaseModel):
    language: str
    timezone: str
    currency: str
    business_hours: Optional[dict]
    booking_rules: Optional[dict]
    ai_settings: Optional[dict]
    notification_settings: Optional[dict]

class ClientSettingsUpdate(BaseModel):
    language: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    business_hours: Optional[dict] = None
    booking_rules: Optional[dict] = None
    ai_settings: Optional[dict] = None
    notification_settings: Optional[dict] = None

# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("", response_model=List[ClientProfileResponse])
async def list_all_clients(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Super Admin endpoint to list all clinics globally.
    """
    if not ctx.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can list all clinics"
        )
    
    stmt = select(Client)
    result = await db.execute(stmt)
    clients = result.scalars().all()
    return clients


@router.get("/profile", response_model=ClientProfileResponse)
async def get_client_profile(
    ctx: TenantContext = Depends(require_tenant),
):
    """
    Returns the full clinic profile for the current tenant.
    """
    client = ctx.client
    return client


@router.put("/profile", response_model=ClientProfileResponse)
async def update_client_profile(
    payload: ClientProfileUpdate,
    ctx: TenantContext = Depends(require_owner_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates clinic settings. Only clinic owners and super admins can call this.
    """
    client = ctx.client
    if not client:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admins must specify a clinic to update",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    await db.commit()
    await db.refresh(client)
    return client


@router.get("/settings", response_model=ClientSettingsResponse)
async def get_client_settings(
    ctx: TenantContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the settings for the current tenant.
    """
    stmt = select(ClientSettings).where(ClientSettings.client_id == ctx.client.id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        # Return default if not initialized
        settings = ClientSettings(
            client_id=ctx.client.id,
            language="en",
            timezone=ctx.client.timezone,
            currency=ctx.client.currency
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        
    return settings


@router.put("/settings", response_model=ClientSettingsResponse)
async def update_client_settings(
    payload: ClientSettingsUpdate,
    ctx: TenantContext = Depends(require_owner_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates settings for the current tenant.
    """
    stmt = select(ClientSettings).where(ClientSettings.client_id == ctx.client.id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        settings = ClientSettings(
            client_id=ctx.client.id,
            language="en",
            timezone=ctx.client.timezone,
            currency=ctx.client.currency
        )
        db.add(settings)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    await db.commit()
    await db.refresh(settings)
    return settings
