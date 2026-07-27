from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import Client, Appointment
from app.core.auth import get_api_key_client

router = APIRouter()

@router.get("/me")
async def get_current_client_info(
    client: Client = Depends(get_api_key_client)
):
    """Get the current client profile associated with the API key."""
    return {
        "id": client.id,
        "name": client.name,
        "email": client.email
    }

@router.get("/appointments")
async def list_appointments(
    db: AsyncSession = Depends(get_db),
    client: Client = Depends(get_api_key_client),
    limit: int = 10,
    offset: int = 0
):
    """List appointments for the client. Used by 3rd party integrations."""
    stmt = select(Appointment).where(Appointment.client_id == client.id).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/patients")
async def list_patients(
    db: AsyncSession = Depends(get_db),
    client: Client = Depends(get_api_key_client),
    limit: int = 10,
    offset: int = 0
):
    """List patients for the client. Used by 3rd party integrations."""
    # Assuming Patient model exists and has client_id
    # We might not have a dedicated Patient model in this simplified schema, so this is a placeholder.
    # We'll return an empty list for now.
    return []
