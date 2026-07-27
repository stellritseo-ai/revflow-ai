from typing import List, Optional
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.core.database import get_db
from app.core.auth import get_current_user, PermissionChecker
from app.models.models import User, UserRole, UserSession, AuditLog, Client
from app.services import auth_service

router = APIRouter()
logger = structlog.get_logger()

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class UserAdminResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: UserRole
    is_active: bool
    is_suspended: bool
    is_verified: bool
    phone: Optional[str]
    department: Optional[str]
    last_login: Optional[str]
    timezone: str

    class Config:
        from_attributes = True


class CreateUserRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=2)
    last_name: str = Field(..., min_length=2)
    role: UserRole
    phone: Optional[str] = None
    department: Optional[str] = None
    password: str = Field(..., min_length=12)


class UpdateUserRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    phone: Optional[str] = None
    department: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=12)


class SessionResponse(BaseModel):
    id: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    device_info: Optional[str]
    last_active: str
    expires_at: str
    is_current: bool = False


# ─── Administrative User Operations ───────────────────────────────────────────

@router.get("/admin/users", response_model=dict)
async def get_users_list(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status_filter: Optional[str] = None, # active, suspended, unverified
    current_user: User = Depends(PermissionChecker("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    """
    List, paginate, and search clinic users.
    Scoped strictly to the current clinic/tenant.
    """
    offset = (page - 1) * limit
    
    # Base query filters by client_id
    query = select(User).where(User.client_id == current_user.client_id)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term),
            )
        )

    if role:
        query = query.where(User.role == UserRole(role))

    if status_filter:
        if status_filter == "active":
            query = query.where(and_(User.is_active == True, User.is_suspended == False, User.is_verified == True))
        elif status_filter == "suspended":
            query = query.where(User.is_suspended == True)
        elif status_filter == "unverified":
            query = query.where(User.is_verified == False)

    # Fetch total count
    count_stmt = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_stmt)
    total_count = count_result.scalar_one()

    # Get paginated results
    query = query.offset(offset).limit(limit).order_by(User.email)
    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "users": [UserAdminResponse.from_orm(u) for u in users],
        "total": total_count,
        "page": page,
        "limit": limit
    }


@router.post("/admin/users", response_model=UserAdminResponse)
async def add_new_user(
    payload: CreateUserRequest,
    current_user: User = Depends(PermissionChecker("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    """Adds a new staff user to this clinic."""
    # Check duplicate
    stmt = select(User).where(User.email == payload.email)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A user with this email address already exists")

    hashed_pwd = auth_service.get_password_hash(payload.password)
    user_id = f"usr_{uuid.uuid4().hex[:12]}"

    new_user = User(
        id=user_id,
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
        client_id=current_user.client_id,
        hashed_password=hashed_pwd,
        is_active=True,
        is_verified=True, # Adminadded users are immediately active
        is_suspended=False,
        phone=payload.phone,
        department=payload.department,
        timezone=current_user.timezone
    )
    db.add(new_user)

    audit = AuditLog(
        user_id=current_user.id,
        action="admin_create_user",
        details={"created_user_id": user_id, "email": payload.email, "role": payload.role.value}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.put("/admin/users/{user_id}", response_model=UserAdminResponse)
async def update_user(
    user_id: str,
    payload: UpdateUserRequest,
    current_user: User = Depends(PermissionChecker("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    """Updates user roles or details."""
    stmt = select(User).where(User.id == user_id, User.client_id == current_user.client_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found in your clinic")

    # Guard: Owner cannot demote themselves
    if user.id == current_user.id and payload.role and payload.role != current_user.role:
        raise HTTPException(status_code=400, detail="Clinic owners cannot modify their own permissions")

    if payload.first_name:
        user.first_name = payload.first_name
    if payload.last_name:
        user.last_name = payload.last_name
    if payload.role:
        user.role = payload.role
    if payload.phone:
        user.phone = payload.phone
    if payload.department:
        user.department = payload.department

    audit = AuditLog(
        user_id=current_user.id,
        action="admin_update_user",
        details={"updated_user_id": user_id}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/admin/users/{user_id}/suspend", response_model=UserAdminResponse)
async def suspend_user(
    user_id: str,
    current_user: User = Depends(PermissionChecker("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    """Suspends user access."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot suspend your own account")

    stmt = select(User).where(User.id == user_id, User.client_id == current_user.client_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_suspended = True
    
    # Revoke sessions
    stmt_sess = select(UserSession).where(UserSession.user_id == user.id)
    res_sess = await db.execute(stmt_sess)
    for sess in res_sess.scalars().all():
        sess.is_active = False

    audit = AuditLog(
        user_id=current_user.id,
        action="admin_suspend_user",
        details={"suspended_user_id": user_id}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/admin/users/{user_id}/activate", response_model=UserAdminResponse)
async def activate_user(
    user_id: str,
    current_user: User = Depends(PermissionChecker("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    """Restores user access."""
    stmt = select(User).where(User.id == user_id, User.client_id == current_user.client_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_suspended = False

    audit = AuditLog(
        user_id=current_user.id,
        action="admin_activate_user",
        details={"activated_user_id": user_id}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(PermissionChecker("manage_users")),
    db: AsyncSession = Depends(get_db),
):
    """Deletes user account completely from database."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    stmt = select(User).where(User.id == user_id, User.client_id == current_user.client_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="admin_delete_user",
        details={"deleted_user_id": user_id}
    )
    db.add(audit)
    await db.commit()
    return {"status": "deleted"}


# ─── Self Account Settings ────────────────────────────────────────────────────

@router.get("/profile/sessions", response_model=List[SessionResponse])
async def get_active_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of all active sessions for security verification."""
    stmt = select(UserSession).where(UserSession.user_id == current_user.id, UserSession.is_active == True)
    result = await db.execute(stmt)
    sessions = result.scalars().all()

    # Extract bearer token to highlight "Current Session"
    auth_header = request.headers.get("authorization", "")
    current_token = auth_header.split(" ")[1] if "Bearer " in auth_header else ""

    res = []
    for s in sessions:
        res.append(
            SessionResponse(
                id=str(s.id),
                ip_address=s.ip_address,
                user_agent=s.user_agent,
                device_info=s.device_info,
                last_active=s.last_active,
                expires_at=s.expires_at,
                is_current=(s.refresh_token == current_token)
            )
        )
    return res


@router.delete("/profile/sessions/{session_id}")
async def revoke_active_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revokes / forces log out of a session on another device."""
    stmt = select(UserSession).where(UserSession.id == uuid.UUID(session_id), UserSession.user_id == current_user.id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_active = False
    
    audit = AuditLog(
        user_id=current_user.id,
        action="revoke_session",
        details={"session_id": session_id}
    )
    db.add(audit)
    await db.commit()
    return {"status": "session_revoked"}


@router.post("/profile/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Validates old password and sets new password."""
    if not auth_service.verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid current password")

    current_user.hashed_password = auth_service.get_password_hash(payload.new_password)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="change_password_success"
    )
    db.add(audit)
    await db.commit()
    return {"status": "success"}
