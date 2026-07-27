from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets
import hashlib

from app.core.database import get_db
from app.models.developer import APIKey
from app.models.models import User
from app.schemas.developer import APIKeyCreate, APIKeyResponse, APIKeyGenerateResponse
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/api-keys", response_model=APIKeyGenerateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    key_in: APIKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="Not associated with a client")
        
    raw_key = f"rev_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    
    new_key = APIKey(
        name=key_in.name,
        key_hash=key_hash,
        key_prefix=raw_key[:10],
        scopes=key_in.scopes,
        client_id=current_user.client_id,
        user_id=current_user.id
    )
    
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)
    
    return {
        "id": new_key.id,
        "name": new_key.name,
        "key_prefix": new_key.key_prefix,
        "is_active": new_key.is_active,
        "scopes": new_key.scopes,
        "client_id": new_key.client_id,
        "key": raw_key
    }

@router.get("/api-keys", response_model=List[APIKeyResponse])
async def get_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="Not associated with a client")
        
    stmt = select(APIKey).where(APIKey.client_id == current_user.client_id)
    result = await db.execute(stmt)
    keys = result.scalars().all()
    
    return keys

@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(APIKey).where(APIKey.id == key_id, APIKey.client_id == current_user.client_id)
    result = await db.execute(stmt)
    key = result.scalar_one_or_none()
    
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
        
    await db.delete(key)
    await db.commit()
    return None
