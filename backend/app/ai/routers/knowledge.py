"""
Knowledge Base Router — Upload and manage clinic knowledge sources.
"""
from __future__ import annotations
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.ai.models import KnowledgeSource, KnowledgeSourceType, KnowledgeSourceStatus
from app.ai.services.knowledge_service import process_knowledge_source

router = APIRouter(prefix="/ai/knowledge", tags=["Knowledge Base"])

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "knowledge")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
MAX_FILE_SIZE_MB = 20


class KnowledgeSourceResponse(BaseModel):
    id: str
    title: str
    source_type: str
    status: str
    chunk_count: int
    character_count: int
    file_size_bytes: Optional[int] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/sources", response_model=List[KnowledgeSourceResponse])
async def list_knowledge_sources(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all knowledge sources for the current clinic."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(KnowledgeSource)
        .where(KnowledgeSource.client_id == current_user.client_id)
        .order_by(KnowledgeSource.created_at.desc())
    )
    sources = result.scalars().all()

    return [
        KnowledgeSourceResponse(
            id=str(s.id),
            title=s.title,
            source_type=s.source_type.value,
            status=s.status.value,
            chunk_count=s.chunk_count,
            character_count=s.character_count,
            file_size_bytes=s.file_size_bytes,
            error_message=s.error_message,
            created_at=str(s.created_at) if hasattr(s, "created_at") and s.created_at else None,
        )
        for s in sources
    ]


@router.post("/upload", response_model=KnowledgeSourceResponse)
async def upload_knowledge_source(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    source_type: str = Form(default="faq"),
    title: Optional[str] = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a knowledge document. Processing happens in the background.
    Supported: PDF, DOCX, TXT, MD
    """
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    # Validate file type
    filename = file.filename or "upload.txt"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Validate source type
    try:
        source_type_enum = KnowledgeSourceType(source_type)
    except ValueError:
        source_type_enum = KnowledgeSourceType.FAQ

    # Read file content
    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {MAX_FILE_SIZE_MB}MB"
        )

    # Save file to disk
    safe_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, str(current_user.client_id), safe_filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, "wb") as f:
        f.write(content)

    # Create knowledge source record
    source = KnowledgeSource(
        client_id=current_user.client_id,
        title=title or filename,
        source_type=source_type_enum,
        status=KnowledgeSourceStatus.PENDING,
        file_path=file_path,
        file_size_bytes=file_size,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)

    # Process in background
    background_tasks.add_task(
        _process_in_background,
        source_id=str(source.id),
        content=content,
        filename=filename,
    )

    return KnowledgeSourceResponse(
        id=str(source.id),
        title=source.title,
        source_type=source.source_type.value,
        status=source.status.value,
        chunk_count=0,
        character_count=0,
        file_size_bytes=file_size,
    )


async def _process_in_background(source_id: str, content: bytes, filename: str):
    """Background task to process the uploaded document."""
    from app.core.database import async_session_factory
    from sqlalchemy import select as sa_select
    import uuid as uuid_mod

    async with async_session_factory() as db:
        result = await db.execute(
            sa_select(KnowledgeSource).where(KnowledgeSource.id == uuid_mod.UUID(source_id))
        )
        source = result.scalar_one_or_none()
        if source:
            await process_knowledge_source(source, content, filename, db)


@router.delete("/sources/{source_id}")
async def delete_knowledge_source(
    source_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a knowledge source and all its chunks."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(KnowledgeSource).where(
            KnowledgeSource.id == source_id,
            KnowledgeSource.client_id == current_user.client_id,
        )
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="Knowledge source not found")

    # Delete file from disk
    if source.file_path and os.path.exists(source.file_path):
        try:
            os.remove(source.file_path)
        except OSError:
            pass

    await db.delete(source)
    await db.commit()

    return {"status": "deleted", "id": source_id}


@router.get("/sources/{source_id}/status")
async def get_source_status(
    source_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Poll the processing status of a knowledge source."""
    if not current_user.client_id:
        raise HTTPException(status_code=403, detail="No clinic associated")

    result = await db.execute(
        select(KnowledgeSource).where(
            KnowledgeSource.id == source_id,
            KnowledgeSource.client_id == current_user.client_id,
        )
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="Not found")

    return {
        "id": str(source.id),
        "status": source.status.value,
        "chunk_count": source.chunk_count,
        "character_count": source.character_count,
        "error_message": source.error_message,
    }
