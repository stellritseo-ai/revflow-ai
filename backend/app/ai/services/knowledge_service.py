"""
Knowledge Service — Document processing pipeline.
Upload → Extract text → Clean → Chunk → Embed → Store.
Uses stdlib only (no PyPDF2/python-docx) with graceful degradation.
"""
from __future__ import annotations
import io
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.ai.models import (
    KnowledgeSource,
    KnowledgeChunk,
    KnowledgeSourceStatus,
    KnowledgeSourceType,
)
from app.ai.embeddings.embedder import embed_text

logger = structlog.get_logger()

# Chunking configuration
CHUNK_SIZE = 500        # Characters per chunk
CHUNK_OVERLAP = 80     # Overlap between chunks


def extract_text_from_bytes(content: bytes, filename: str) -> str:
    """
    Extract plain text from uploaded file content.
    Handles TXT files directly; attempts basic PDF/DOCX extraction.
    """
    filename_lower = filename.lower()

    # Plain text
    if filename_lower.endswith(".txt") or filename_lower.endswith(".md"):
        try:
            return content.decode("utf-8", errors="replace")
        except Exception:
            return content.decode("latin-1", errors="replace")

    # PDF — try to extract using binary parsing (no PyPDF2 needed for simple PDFs)
    if filename_lower.endswith(".pdf"):
        try:
            text = _extract_pdf_text(content)
            if text.strip():
                return text
        except Exception as e:
            logger.warning("PDF extraction failed", error=str(e))
        # Fallback: return raw decodable text
        return content.decode("latin-1", errors="replace").replace("\x00", " ")

    # DOCX — try zip-based XML extraction
    if filename_lower.endswith(".docx"):
        try:
            text = _extract_docx_text(content)
            if text.strip():
                return text
        except Exception as e:
            logger.warning("DOCX extraction failed", error=str(e))

    # Default: try UTF-8 decode
    return content.decode("utf-8", errors="replace")


def _extract_pdf_text(content: bytes) -> str:
    """
    Basic PDF text extraction without external libraries.
    Extracts text from BT...ET blocks in PDF stream.
    Works for simple/non-encrypted PDFs.
    """
    text_parts = []
    content_str = content.decode("latin-1", errors="replace")

    # Extract text from PDF text objects (BT...ET blocks)
    bt_blocks = re.findall(r"BT\s+(.*?)\s+ET", content_str, re.DOTALL)
    for block in bt_blocks:
        # Extract strings in parentheses (Tj/TJ operators)
        strings = re.findall(r"\(([^)]*)\)", block)
        text_parts.extend(strings)

    if text_parts:
        raw = " ".join(text_parts)
        # Clean PDF escape sequences
        raw = raw.replace("\\n", "\n").replace("\\r", "\n").replace("\\t", " ")
        raw = re.sub(r"\\(\d{3})", lambda m: chr(int(m.group(1), 8)), raw)
        return clean_text(raw)

    return ""


def _extract_docx_text(content: bytes) -> str:
    """
    Basic DOCX text extraction using zipfile (DOCX is a ZIP archive).
    Extracts text from word/document.xml.
    """
    import zipfile

    with zipfile.ZipFile(io.BytesIO(content)) as z:
        if "word/document.xml" in z.namelist():
            xml_content = z.read("word/document.xml").decode("utf-8", errors="replace")
            # Strip XML tags
            text = re.sub(r"<[^>]+>", " ", xml_content)
            return clean_text(text)
    return ""


def clean_text(text: str) -> str:
    """Clean and normalize extracted text."""
    # Remove null bytes and control characters
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
    # Normalize whitespace
    text = re.sub(r"[ \t]+", " ", text)
    # Normalize line breaks
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Remove very short lines (artifacts)
    lines = [line.strip() for line in text.split("\n")]
    lines = [line for line in lines if len(line) > 2]
    return "\n".join(lines).strip()


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """
    Split text into overlapping chunks.
    Tries to split on sentence/paragraph boundaries.
    """
    if not text:
        return []

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size

        if end >= text_len:
            chunk = text[start:].strip()
            if chunk:
                chunks.append(chunk)
            break

        # Try to find a good split point (sentence or newline boundary)
        split_pos = end
        for sep in ["\n\n", "\n", ". ", "! ", "? "]:
            pos = text.rfind(sep, start + chunk_size // 2, end)
            if pos != -1:
                split_pos = pos + len(sep)
                break

        chunk = text[start:split_pos].strip()
        if chunk:
            chunks.append(chunk)

        start = max(split_pos - overlap, start + 1)

    return chunks


async def process_knowledge_source(
    source: KnowledgeSource,
    file_content: bytes,
    filename: str,
    db: AsyncSession,
) -> None:
    """
    Full processing pipeline: extract → clean → chunk → embed → store.
    Called as a background task after upload.
    """
    source.status = KnowledgeSourceStatus.PROCESSING
    await db.flush()

    try:
        # 1. Extract text
        logger.info("Extracting text", source_id=str(source.id), filename=filename)
        raw_text = extract_text_from_bytes(file_content, filename)

        if not raw_text.strip():
            source.status = KnowledgeSourceStatus.FAILED
            source.error_message = "Could not extract text from file"
            return

        # 2. Clean text
        cleaned = clean_text(raw_text)
        source.character_count = len(cleaned)

        # 3. Chunk text
        chunks = chunk_text(cleaned)
        logger.info("Text chunked", chunks=len(chunks), source_id=str(source.id))

        # 4. Embed & store each chunk
        stored = 0
        for i, chunk_content in enumerate(chunks):
            embedding = await embed_text(chunk_content)

            chunk = KnowledgeChunk(
                client_id=source.client_id,
                source_id=source.id,
                chunk_index=i,
                content=chunk_content,
                embedding=embedding,
                token_count=len(chunk_content.split()),
            )
            db.add(chunk)
            stored += 1

        source.chunk_count = stored
        source.status = KnowledgeSourceStatus.READY
        logger.info("Knowledge source processed", source_id=str(source.id), chunks=stored)

    except Exception as e:
        logger.error("Knowledge processing failed", error=str(e), source_id=str(source.id))
        source.status = KnowledgeSourceStatus.FAILED
        source.error_message = str(e)[:500]

    await db.commit()


async def delete_knowledge_source(source_id: str, client_id: str, db: AsyncSession) -> bool:
    """Delete a knowledge source and all its chunks."""
    stmt = select(KnowledgeSource).where(
        KnowledgeSource.id == source_id,
        KnowledgeSource.client_id == client_id,
    )
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()

    if not source:
        return False

    await db.delete(source)
    await db.commit()
    return True
