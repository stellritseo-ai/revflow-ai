from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.admin.services.tenant_service import TenantService
import uuid

router = APIRouter(prefix="/tenants", tags=["Admin Tenants"])

@router.get("/")
def list_tenants(db: Session = Depends(get_db)):
    return {"message": "List of tenants"}

@router.post("/{client_id}/suspend")
def suspend_tenant(client_id: uuid.UUID, db: Session = Depends(get_db)):
    success = TenantService.suspend_tenant(db, client_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return {"message": "Tenant suspended"}
