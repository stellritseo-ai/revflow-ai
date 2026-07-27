import hmac
import hashlib
import json
import logging
import httpx
from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.developer import WebhookSubscription

logger = logging.getLogger(__name__)

async def dispatch_webhook(db: AsyncSession, client_id: str, event_name: str, payload: Dict[str, Any]):
    """
    Dispatches a webhook to all active subscriptions for a given client and event.
    Generates an HMAC signature using the subscription's secret for verification.
    """
    try:
        # Find all active subscriptions for this client that listen to this event
        stmt = select(WebhookSubscription).where(
            WebhookSubscription.client_id == client_id,
            WebhookSubscription.is_active == True
        )
        result = await db.execute(stmt)
        subscriptions = result.scalars().all()

        for sub in subscriptions:
            if event_name in sub.events or "*" in sub.events:
                await send_webhook_payload(sub.url, sub.secret, event_name, payload)
    
    except Exception as e:
        logger.error(f"Failed to dispatch webhooks for client {client_id}: {str(e)}")

async def send_webhook_payload(url: str, secret: str, event_name: str, payload: Dict[str, Any]):
    """
    Sends the actual HTTP POST request.
    This should ideally be pushed to a Celery queue in production, 
    but we use asyncio in BackgroundTasks for simplicity here.
    """
    body = json.dumps({
        "event": event_name,
        "data": payload
    }).encode("utf-8")

    # Generate HMAC signature
    signature = hmac.new(
        secret.encode("utf-8"),
        body,
        hashlib.sha256
    ).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-RevFlow-Signature": f"sha256={signature}",
        "X-RevFlow-Event": event_name
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, content=body, headers=headers, timeout=10.0)
            response.raise_for_status()
            logger.info(f"Successfully dispatched webhook to {url} for event {event_name}")
    except httpx.HTTPError as exc:
        logger.error(f"HTTP Exception for {exc.request.url} - {exc}")
    except Exception as e:
        logger.error(f"Failed to send webhook to {url}: {str(e)}")
