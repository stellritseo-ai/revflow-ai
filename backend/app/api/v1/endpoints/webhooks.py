from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets

from app.core.database import get_db
from app.models.developer import WebhookSubscription
from app.models.models import User
from app.schemas.developer import WebhookCreate, WebhookResponse
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=WebhookResponse, status_code=status.HTTP_201_CREATED)
async def create_webhook(
    webhook_in: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="Not associated with a client")
        
    secret = secrets.token_hex(32)
    
    new_webhook = WebhookSubscription(
        url=webhook_in.url,
        secret=secret,
        events=webhook_in.events,
        client_id=current_user.client_id
    )
    
    db.add(new_webhook)
    await db.commit()
    await db.refresh(new_webhook)
    
    return new_webhook

@router.get("/", response_model=List[WebhookResponse])
async def get_webhooks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="Not associated with a client")
        
    stmt = select(WebhookSubscription).where(WebhookSubscription.client_id == current_user.client_id)
    result = await db.execute(stmt)
    webhooks = result.scalars().all()
    
    return webhooks

@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    webhook_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(WebhookSubscription).where(
        WebhookSubscription.id == webhook_id, 
        WebhookSubscription.client_id == current_user.client_id
    )
    result = await db.execute(stmt)
    webhook = result.scalar_one_or_none()
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
        
    await db.delete(webhook)
    await db.commit()
    return None
