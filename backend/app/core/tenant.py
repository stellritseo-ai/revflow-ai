from dataclasses import dataclass
from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, Client, UserRole


@dataclass
class TenantContext:
    """Holds the current request's authenticated user and their clinic tenant."""
    user: User
    client: Optional[Client]

    @property
    def client_id(self):
        return self.client.id if self.client else None

    @property
    def is_super_admin(self) -> bool:
        return self.user.role == UserRole.SUPER_ADMIN


async def get_tenant_context(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TenantContext:
    """
    FastAPI dependency that loads the full tenant (Client) for the current user.
    Super admins have no client_id and can operate globally.
    """
    client = None
    if current_user.client_id:
        stmt = select(Client).where(Client.id == current_user.client_id)
        result = await db.execute(stmt)
        client = result.scalar_one_or_none()

    if not client:
        # Fallback to primary default clinic for super admins or unassigned users
        stmt = select(Client).where(Client.active == True).limit(1)
        result = await db.execute(stmt)
        client = result.scalar_one_or_none()

    return TenantContext(user=current_user, client=client)


def require_tenant(ctx: TenantContext = Depends(get_tenant_context)) -> TenantContext:
    """Ensures that the current user belongs to an active tenant (not super_admin without tenant)."""
    if not ctx.client:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires a clinic tenant context",
        )
    return ctx


def require_owner_or_admin(ctx: TenantContext = Depends(get_tenant_context)) -> TenantContext:
    """Only clinic owners and super admins can access this endpoint."""
    if ctx.user.role not in (UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clinic owners can perform this action",
        )
    return ctx
