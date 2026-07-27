from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.developer import Plugin, InstalledPlugin
from app.models.models import User
from app.schemas.developer import PluginResponse, InstalledPluginCreate, InstalledPluginResponse
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/plugins", response_model=List[PluginResponse])
async def list_plugins(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all available (published) plugins."""
    stmt = select(Plugin).where(Plugin.is_published == True)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/installed", response_model=List[InstalledPluginResponse])
async def get_installed_plugins(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="Not associated with a client")
        
    stmt = select(InstalledPlugin).where(InstalledPlugin.client_id == current_user.client_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/installed", response_model=InstalledPluginResponse, status_code=status.HTTP_201_CREATED)
async def install_plugin(
    install_in: InstalledPluginCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="Not associated with a client")
        
    # Check if already installed
    stmt = select(InstalledPlugin).where(
        InstalledPlugin.plugin_id == install_in.plugin_id,
        InstalledPlugin.client_id == current_user.client_id
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Plugin already installed")
        
    installed = InstalledPlugin(
        plugin_id=install_in.plugin_id,
        client_id=current_user.client_id,
        config=install_in.config
    )
    
    db.add(installed)
    await db.commit()
    await db.refresh(installed)
    
    return installed

@router.delete("/installed/{installed_id}", status_code=status.HTTP_204_NO_CONTENT)
async def uninstall_plugin(
    installed_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(InstalledPlugin).where(
        InstalledPlugin.id == installed_id, 
        InstalledPlugin.client_id == current_user.client_id
    )
    result = await db.execute(stmt)
    installed = result.scalar_one_or_none()
    
    if not installed:
        raise HTTPException(status_code=404, detail="Installation not found")
        
    await db.delete(installed)
    await db.commit()
    return None
