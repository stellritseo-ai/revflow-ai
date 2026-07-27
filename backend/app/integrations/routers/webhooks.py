"""
Webhooks Router — Receive real-time events from PMS providers.
Validates HMAC signatures before processing.
"""
import hashlib
import hmac
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.integrations.models import IntegrationCredential, PMSProvider
from app.integrations.services.integration_manager import get_provider_instance

router = APIRouter(prefix="/integrations/webhooks", tags=["Integration Webhooks"])


def _verify_hmac(payload: bytes, signature: str, secret: str) -> bool:
    """Validate an HMAC-SHA256 webhook signature."""
    try:
        expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(f"sha256={expected}", signature)
    except Exception:
        return False


@router.post("/{provider}/incoming")
async def receive_webhook(
    provider: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Receive a webhook event from a PMS provider.
    The URL must include a query param: ?client_id=xxx
    """
    client_id = request.query_params.get("client_id")
    if not client_id:
        raise HTTPException(status_code=400, detail="client_id required")

    # Validate provider
    try:
        pms = PMSProvider(provider)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    # Load credential
    cred_result = await db.execute(
        select(IntegrationCredential).where(
            IntegrationCredential.client_id == client_id,
            IntegrationCredential.provider == pms,
            IntegrationCredential.is_active == True,
        )
    )
    cred = cred_result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="No active integration for this clinic")

    # Validate signature if signing secret is configured
    raw_body = await request.body()
    signature = request.headers.get("X-Webhook-Signature", "")
    if signature and cred.signing_secret:
        if not _verify_hmac(raw_body, signature, cred.signing_secret):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # Parse payload and dispatch to provider
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    event_type = payload.get("event", payload.get("type", "unknown"))

    provider_instance = get_provider_instance(cred)
    result = await provider_instance.webhook_handler(event_type, payload)

    return {"received": True, "provider": provider, "event": event_type, "result": result}
