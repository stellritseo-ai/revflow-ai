from typing import Optional, List
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, UserRole, Client, AuditLog, UserSession, PasswordReset, EmailVerification
from app.services import auth_service

router = APIRouter()
logger = structlog.get_logger()

# ─── Pydantic Payloads ────────────────────────────────────────────────────────

class ClinicRegistrationRequest(BaseModel):
    # Step 1: Clinic details
    clinic_name: str = Field(..., min_length=2)
    owner_name: str = Field(..., min_length=2)
    business_email: EmailStr
    phone: str = Field(..., min_length=7)
    country: str = Field(..., min_length=2)
    # Step 2: Business details
    address: str = Field(..., min_length=5)
    timezone: str = Field(default="America/New_York")
    specialty: str = Field(..., min_length=3)
    website: Optional[str] = None
    # Step 3: Admin User
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=12)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=12)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_clinic(payload: ClinicRegistrationRequest, db: AsyncSession = Depends(get_db)):
    """
    Registers a new clinic (Tenant) and creates the owner admin account.
    Sends verification email token simulation.
    """
    # Check if clinic or user already exists
    stmt_user = select(User).where(User.email == payload.admin_email)
    res_user = await db.execute(stmt_user)
    if res_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Administrator email is already registered")

    # Generate slug from clinic name
    slug = payload.clinic_name.lower().replace(" ", "-").replace("'", "")
    # Deduplicate slug if needed
    stmt_sub = select(Client).where(Client.slug == slug)
    res_sub = await db.execute(stmt_sub)
    if res_sub.scalar_one_or_none():
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"

    # 1. Create client
    client = Client(
        clinic_name=payload.clinic_name,
        slug=slug,
        phone=payload.phone,
        timezone=payload.timezone,
        pms_type="none",
        active=True,
    )
    db.add(client)
    await db.flush() # Populates client.id

    # 2. Create Admin user
    try:
        auth_service.validate_password_strength(payload.admin_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    hashed_pwd = auth_service.get_password_hash(payload.admin_password)
    
    # Split first and last name from owner_name
    name_parts = payload.owner_name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    user = User(
        id=user_id,
        email=payload.admin_email,
        first_name=first_name,
        last_name=last_name,
        role=UserRole.CLINIC_OWNER,
        client_id=client.id,
        hashed_password=hashed_pwd,
        is_active=True,
        is_verified=False, # Must verify email
        phone=payload.phone,
        timezone=payload.timezone,
    )
    db.add(user)
    await db.flush()

    # 3. Create Email Verification token
    verification_token = auth_service.generate_secure_token()
    expiry = datetime.now(timezone.utc) + timedelta(days=1)
    verification = EmailVerification(
        user_id=user.id,
        token=verification_token,
        expires_at=expiry.isoformat(),
        is_used=False
    )
    db.add(verification)

    # 4. Audit Log
    audit = AuditLog(
        user_id=user.id,
        action="clinic_registration",
        details={
            "clinic_name": payload.clinic_name,
            "slug": slug,
            "admin_email": payload.admin_email
        }
    )
    db.add(audit)
    await db.commit()

    # Log token simulator so developer can fetch it easily without real email server
    logger.info(
        "Simulation: Verification email sent",
        email=payload.admin_email,
        verification_link=f"http://localhost:3000/auth/verify-email?token={verification_token}"
    )

    return {
        "status": "registered",
        "slug": slug,
        "email": payload.admin_email,
        "verification_token_sim": verification_token # Helper for testing/automation
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Standard secure credentials login.
    Checks password, locks account on consecutive brute force attempts.
    """
    # 1. Check lockout state
    is_locked, remaining = await auth_service.check_login_lockout(payload.email)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account locked. Try again in {remaining // 60 + 1} minutes."
        )

    # 2. Look up user
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not auth_service.verify_password(payload.password, user.hashed_password):
        # Record failure for brute force checking
        lockout_duration = await auth_service.record_login_attempt(payload.email, success=False)
        detail = "Invalid email or password credentials"
        if lockout_duration:
            detail = f"Too many failed attempts. Account locked for {lockout_duration} minutes."
        
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

    # Reset failure counters
    await auth_service.record_login_attempt(payload.email, success=True)

    if user.is_suspended:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been suspended")

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification is required before access is granted."
        )

    # 3. Create active session and generate tokens
    access_token = auth_service.create_access_token(user.id, user.email, user.role.value)
    refresh_token = auth_service.generate_secure_token()

    session_expire = datetime.now(timezone.utc) + timedelta(days=7)
    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent", "unknown"),
        device_info=request.headers.get("sec-ch-ua-platform", "Browser"),
        is_active=True,
        last_active=datetime.now(timezone.utc).isoformat(),
        expires_at=session_expire.isoformat()
    )
    db.add(session)

    # Update last login
    user.last_login = datetime.now(timezone.utc).isoformat()
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="user_login",
        ip_address=session.ip_address,
        user_agent=session.user_agent,
    )
    db.add(audit)
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "client_id": str(user.client_id) if user.client_id else None
        }
    }


class DevLoginRequest(BaseModel):
    email: str
    role: str


@router.post("/login-dev")
async def login_dev(
    payload: DevLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Developer Simulator login.
    Generates JWT and mock user session/tenant context automatically.
    """
    try:
        role_enum = UserRole(payload.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid developer role: {payload.role}"
        )

    # Find existing user by email
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        # Check if default client exists, otherwise create one
        client_stmt = select(Client).where(Client.clinic_name == "Development Practice")
        client_result = await db.execute(client_stmt)
        client = client_result.scalar_one_or_none()
        if not client:
            client = Client(
                clinic_name="Development Practice",
                slug="dev-practice",
                phone="555-0100",
                timezone="America/New_York",
                pms_type="none",
                active=True,
            )
            db.add(client)
            await db.flush()

        # Create new user
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        hashed_pwd = auth_service.get_password_hash("password12345")
        
        name_parts = payload.email.split("@")[0].split("_")
        first_name = name_parts[0].capitalize()
        last_name = name_parts[1].capitalize() if len(name_parts) > 1 else "User"

        user = User(
            id=user_id,
            email=payload.email,
            first_name=first_name,
            last_name=last_name,
            role=role_enum,
            client_id=client.id,
            hashed_password=hashed_pwd,
            is_active=True,
            is_verified=True, # Auto verify for developer simulator
            phone="555-0100",
            timezone="America/New_York",
        )
        db.add(user)
        await db.flush()

    # Create active session and generate tokens
    access_token = auth_service.create_access_token(user.id, user.email, user.role.value)
    refresh_token = auth_service.generate_secure_token()

    session_expire = datetime.now(timezone.utc) + timedelta(days=7)
    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent", "unknown"),
        device_info=request.headers.get("sec-ch-ua-platform", "Browser"),
        is_active=True,
        last_active=datetime.now(timezone.utc).isoformat(),
        expires_at=session_expire.isoformat()
    )
    db.add(session)

    # Update last login
    user.last_login = datetime.now(timezone.utc).isoformat()
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "client_id": str(user.client_id) if user.client_id else None
        }
    }


@router.post("/refresh")
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refreshes access tokens using active sessions."""
    stmt = select(UserSession).where(UserSession.refresh_token == payload.refresh_token, UserSession.is_active == True)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=401, detail="Invalid refresh session")

    # Check expiry
    expiry = datetime.fromisoformat(session.expires_at)
    if datetime.now(timezone.utc) > expiry:
        session.is_active = False
        await db.commit()
        raise HTTPException(status_code=401, detail="Session expired")

    # Get User
    stmt_user = select(User).where(User.id == session.user_id)
    res_user = await db.execute(stmt_user)
    user = res_user.scalar_one_or_none()

    if not user or user.is_suspended:
        raise HTTPException(status_code=401, detail="User account disabled")

    # Generate new access token
    new_access = auth_service.create_access_token(user.id, user.email, user.role.value)
    
    # Update session last active time
    session.last_active = datetime.now(timezone.utc).isoformat()
    await db.commit()

    return {"access_token": new_access}


@router.post("/logout-all")
async def logout_all_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logs out the user from all devices by invalidating all active sessions.
    """
    stmt = select(UserSession).where(UserSession.user_id == current_user.id, UserSession.is_active == True)
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    
    for session in sessions:
        session.is_active = False
        
    audit = AuditLog(
        user_id=current_user.id,
        action="logout_all_devices",
    )
    db.add(audit)
    await db.commit()
    
    return {"status": "success", "message": "Logged out from all devices successfully."}


@router.post("/verify-email")
async def verify_email(payload: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    """Verifies a user email using their registration token."""
    stmt = select(EmailVerification).where(EmailVerification.token == payload.token, EmailVerification.is_used == False)
    result = await db.execute(stmt)
    verification = result.scalar_one_or_none()

    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or already used verification token")

    # Check expiry
    expiry = datetime.fromisoformat(verification.expires_at)
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Verification link expired")

    # Verify user
    stmt_user = select(User).where(User.id == verification.user_id)
    res_user = await db.execute(stmt_user)
    user = res_user.scalar_one_or_none()

    if user:
        user.is_verified = True
        verification.is_used = True
        
        audit = AuditLog(
            user_id=user.id,
            action="email_verified"
        )
        db.add(audit)
        await db.commit()
        return {"status": "verified"}

    raise HTTPException(status_code=400, detail="User not found")


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Generates password reset links."""
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user:
        # Generate token
        token = auth_service.generate_secure_token()
        expiry = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        reset = PasswordReset(
            user_id=user.id,
            token=token,
            expires_at=expiry.isoformat(),
            is_used=False
        )
        db.add(reset)
        await db.commit()

        # Simulated reset email link
        logger.info(
            "Simulation: Password reset email sent",
            email=payload.email,
            reset_link=f"http://localhost:3000/auth/reset-password?token={token}"
        )
        return {"status": "success", "reset_token_sim": token}

    # Always return success status to prevent user enumeration security issues
    return {"status": "success"}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Applies new password using valid reset token."""
    stmt = select(PasswordReset).where(PasswordReset.token == payload.token, PasswordReset.is_used == False)
    result = await db.execute(stmt)
    reset = result.scalar_one_or_none()

    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    # Check expiry
    expiry = datetime.fromisoformat(reset.expires_at)
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Reset link has expired (15 minute limit)")

    stmt_user = select(User).where(User.id == reset.user_id)
    res_user = await db.execute(stmt_user)
    user = res_user.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    # Update password and consume token
    try:
        auth_service.validate_password_strength(payload.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    user.hashed_password = auth_service.get_password_hash(payload.new_password)
    reset.is_used = True

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="password_reset_success"
    )
    db.add(audit)
    await db.commit()

    return {"status": "password_reset_complete"}
