"""
Integration Providers Router — Connect, disconnect, list, test PMS providers.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.integrations.models import IntegrationCredential, PMSProvider, AuthMethod, ConflictResolution
from app.integrations.services import credential_service
from app.integrations.services.integration_manager import get_provider_instance, build_connection_config

router = APIRouter(prefix="/integrations", tags=["Integrations"])

# ── Provider Catalog ─────────────────────────────────────────────────────────

PROVIDER_CATALOG = [
    {"id": "open_dental", "name": "Open Dental", "auth": "api_key", "supports_webhooks": False, "logo": "🦷", "description": "Most popular open-source dental PMS. REST API.", "status": "available"},
    {"id": "dentrix", "name": "Dentrix", "auth": "oauth2", "supports_webhooks": True, "logo": "🏥", "description": "Henry Schein Dentrix with OAuth 2.0 API.", "status": "available"},
    {"id": "eaglesoft", "name": "Eaglesoft", "auth": "username_password", "supports_webhooks": False, "logo": "🦅", "description": "Patterson Eaglesoft — username/password auth.", "status": "available"},
    {"id": "curve_dental", "name": "Curve Dental", "auth": "api_key", "supports_webhooks": True, "logo": "📊", "description": "Cloud-native dental PMS with real-time sync.", "status": "available"},
    {"id": "denticon", "name": "Denticon", "auth": "api_key", "supports_webhooks": False, "logo": "🔵", "description": "Planet DDS Denticon cloud PMS.", "status": "coming_soon"},
    {"id": "carestack", "name": "CareStack", "auth": "api_key", "supports_webhooks": True, "logo": "💙", "description": "Modern cloud PMS for DSOs.", "status": "coming_soon"},
    {"id": "planet_dds", "name": "Planet DDS", "auth": "api_key", "supports_webhooks": False, "logo": "🌐", "description": "Planet DDS multi-location platform.", "status": "coming_soon"},
    {"id": "mock", "name": "Mock Provider (Dev)", "auth": "none", "supports_webhooks": False, "logo": "🧪", "description": "For testing and development only.", "status": "available"},
]


@router.get("/catalog")
async def list_provider_catalog():
    """List all supported PMS providers and their connection status."""
    return {"providers": PROVIDER_CATALOG}


# ── Schemas ──────────────────────────────────────────────────────────────────

class ConnectProviderRequest(BaseModel):
    provider: str
    environment: str = "production"
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    client_secret: Optional[str] = None
    access_token: Optional[str] = None
    conflict_resolution: str = "keep_pms"
    sync_interval_minutes: int = 60
    auto_sync_enabled: bool = False


class CredentialResponse(BaseModel):
    id: str
    provider: str
    environment: str
    is_active: bool
    is_verified: bool
    last_verified_at: Optional[str] = None
    verification_error: Optional[str] = None
    sync_interval_minutes: int
    auto_sync_enabled: bool
    created_at: str

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/credentials", response_model=List[CredentialResponse])
async def list_credentials(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all PMS credentials configured for this clinic."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(IntegrationCredential).where(
            IntegrationCredential.client_id == str(current_user.client_id)
        ).order_by(IntegrationCredential.created_at.desc())
    )
    creds = result.scalars().all()

    return [CredentialResponse(
        id=c.id,
        provider=c.provider.value,
        environment=c.environment,
        is_active=c.is_active,
        is_verified=c.is_verified,
        last_verified_at=str(c.last_verified_at) if c.last_verified_at else None,
        verification_error=c.verification_error,
        sync_interval_minutes=c.sync_interval_minutes,
        auto_sync_enabled=c.auto_sync_enabled,
        created_at=str(c.created_at),
    ) for c in creds]


@router.post("/credentials/connect")
async def connect_provider(
    payload: ConnectProviderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Connect a PMS provider. Validates credentials and saves encrypted.
    Runs a test connection before saving.
    """
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    # Validate provider
    try:
        pms = PMSProvider(payload.provider)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {payload.provider}")

    # Check for existing connection to this provider
    existing = await db.execute(
        select(IntegrationCredential).where(
            IntegrationCredential.client_id == str(current_user.client_id),
            IntegrationCredential.provider == pms,
        )
    )
    existing_cred = existing.scalar_one_or_none()

    # Build credential record (not yet saved)
    cred = existing_cred or IntegrationCredential(
        id=str(uuid.uuid4()),
        client_id=str(current_user.client_id),
        provider=pms,
    )
    cred.environment = payload.environment
    cred.api_url = payload.api_url or ""
    cred.sync_interval_minutes = payload.sync_interval_minutes
    cred.auto_sync_enabled = payload.auto_sync_enabled

    # Determine auth method
    if payload.api_key:
        cred.auth_method = AuthMethod.API_KEY
        cred.encrypted_api_key = credential_service.encrypt(payload.api_key)
    elif payload.username and payload.password:
        cred.auth_method = AuthMethod.USERNAME_PASSWORD
        cred.encrypted_username = credential_service.encrypt(payload.username)
        cred.encrypted_password = credential_service.encrypt(payload.password)
    elif payload.client_secret:
        cred.auth_method = AuthMethod.OAUTH2
        cred.encrypted_client_secret = credential_service.encrypt(payload.client_secret)
    else:
        cred.auth_method = AuthMethod.NONE

    if payload.access_token:
        cred.encrypted_access_token = credential_service.encrypt(payload.access_token)

    try:
        cred.default_conflict_resolution = ConflictResolution(payload.conflict_resolution)
    except ValueError:
        cred.default_conflict_resolution = ConflictResolution.KEEP_PMS

    if not existing_cred:
        db.add(cred)
    await db.flush()

    # Test connection with the provided credentials
    provider = get_provider_instance(cred)
    test_result = await provider.test_connection()

    cred.is_verified = test_result["success"]
    cred.is_active = test_result["success"]
    cred.last_verified_at = datetime.now(timezone.utc)
    cred.verification_error = None if test_result["success"] else test_result.get("message")

    await db.commit()

    return {
        "success": test_result["success"],
        "message": test_result.get("message", ""),
        "latency_ms": test_result.get("latency_ms", 0),
        "credential_id": cred.id,
    }


@router.post("/credentials/{credential_id}/test")
async def test_connection(
    credential_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run a connection test against a saved credential."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(IntegrationCredential).where(
            IntegrationCredential.id == credential_id,
            IntegrationCredential.client_id == str(current_user.client_id),
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")

    provider = get_provider_instance(cred)
    test_result = await provider.test_connection()

    cred.is_verified = test_result["success"]
    cred.last_verified_at = datetime.now(timezone.utc)
    cred.verification_error = None if test_result["success"] else test_result.get("message")
    await db.commit()

    return test_result


@router.delete("/credentials/{credential_id}")
async def disconnect_provider(
    credential_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect a PMS provider (deactivates, keeps audit log)."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(IntegrationCredential).where(
            IntegrationCredential.id == credential_id,
            IntegrationCredential.client_id == str(current_user.client_id),
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")

    cred.is_active = False
    cred.is_verified = False
    await db.commit()

    return {"success": True, "message": f"Disconnected from {cred.provider.value}"}
