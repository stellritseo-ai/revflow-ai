"""
Field Mapping Router — CRUD for custom field mappings between PMS and RevFlow.
"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.integrations.models import IntegrationFieldMapping

router = APIRouter(prefix="/integrations", tags=["Integration Mapping"])

# Default field mappings per module (PMS → RevFlow)
DEFAULT_PATIENT_MAPPING = [
    {"pms_field": "FirstName", "revflow_field": "first_name"},
    {"pms_field": "LastName", "revflow_field": "last_name"},
    {"pms_field": "Birthdate", "revflow_field": "date_of_birth"},
    {"pms_field": "WirelessPhone", "revflow_field": "phone"},
    {"pms_field": "Email", "revflow_field": "email"},
    {"pms_field": "Address", "revflow_field": "address"},
]

DEFAULT_APPOINTMENT_MAPPING = [
    {"pms_field": "AptDateTime", "revflow_field": "start_datetime"},
    {"pms_field": "AptStatus", "revflow_field": "status"},
    {"pms_field": "ProvNum", "revflow_field": "provider_id"},
    {"pms_field": "Op", "revflow_field": "operatory"},
    {"pms_field": "Note", "revflow_field": "notes"},
]


class FieldMappingRequest(BaseModel):
    credential_id: str
    module: str
    pms_field: str
    revflow_field: str
    transform: Optional[str] = None


class FieldMappingResponse(BaseModel):
    id: str
    credential_id: str
    module: str
    pms_field: str
    revflow_field: str
    transform: Optional[str] = None
    is_active: bool
    created_at: str


@router.get("/mapping/defaults/{module}")
async def get_default_mappings(module: str):
    """Return default field mappings for a given module."""
    if module == "patients":
        return {"module": module, "mappings": DEFAULT_PATIENT_MAPPING}
    elif module == "appointments":
        return {"module": module, "mappings": DEFAULT_APPOINTMENT_MAPPING}
    return {"module": module, "mappings": []}


@router.get("/mapping", response_model=List[FieldMappingResponse])
async def list_mappings(
    credential_id: Optional[str] = None,
    module: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List custom field mappings for this clinic."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    query = select(IntegrationFieldMapping).where(
        IntegrationFieldMapping.client_id == str(current_user.client_id),
        IntegrationFieldMapping.is_active == True,
    )
    if credential_id:
        query = query.where(IntegrationFieldMapping.credential_id == credential_id)
    if module:
        query = query.where(IntegrationFieldMapping.module == module)

    result = await db.execute(query)
    mappings = result.scalars().all()

    return [FieldMappingResponse(
        id=m.id,
        credential_id=m.credential_id,
        module=m.module,
        pms_field=m.pms_field,
        revflow_field=m.revflow_field,
        transform=m.transform,
        is_active=m.is_active,
        created_at=str(m.created_at),
    ) for m in mappings]


@router.post("/mapping", response_model=FieldMappingResponse)
async def create_mapping(
    payload: FieldMappingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a custom field mapping."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    mapping = IntegrationFieldMapping(
        id=str(uuid.uuid4()),
        client_id=str(current_user.client_id),
        credential_id=payload.credential_id,
        module=payload.module,
        pms_field=payload.pms_field,
        revflow_field=payload.revflow_field,
        transform=payload.transform,
    )
    db.add(mapping)
    await db.commit()

    return FieldMappingResponse(
        id=mapping.id,
        credential_id=mapping.credential_id,
        module=mapping.module,
        pms_field=mapping.pms_field,
        revflow_field=mapping.revflow_field,
        transform=mapping.transform,
        is_active=mapping.is_active,
        created_at=str(mapping.created_at),
    )


@router.delete("/mapping/{mapping_id}")
async def delete_mapping(
    mapping_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a custom field mapping."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(IntegrationFieldMapping).where(
            IntegrationFieldMapping.id == mapping_id,
            IntegrationFieldMapping.client_id == str(current_user.client_id),
        )
    )
    mapping = result.scalar_one_or_none()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")

    mapping.is_active = False
    await db.commit()
    return {"success": True}
