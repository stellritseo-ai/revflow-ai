"""
RAG Retriever — Retrieves the most relevant knowledge chunks for a query.
Strict per-client isolation: only searches chunks belonging to the current clinic.
"""
from __future__ import annotations
from typing import List, Optional
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings.embedder import embed_text, find_most_similar
from app.ai.models import KnowledgeChunk, KnowledgeSource, KnowledgeSourceStatus

logger = structlog.get_logger()


async def retrieve_relevant_chunks(
    query: str,
    client_id: str,
    db: AsyncSession,
    top_k: int = 5,
    min_similarity: float = 0.1,
) -> List[dict]:
    """
    Retrieve the top-k most relevant knowledge chunks for a query.
    Strictly isolated to the given client_id.
    
    Returns:
        List of dicts with 'content', 'source_title', 'similarity'
    """
    if not query or not query.strip():
        return []

    # 1. Load all knowledge chunks for this client (only from ready sources)
    stmt = (
        select(KnowledgeChunk, KnowledgeSource.title, KnowledgeSource.source_type)
        .join(KnowledgeSource, KnowledgeChunk.source_id == KnowledgeSource.id)
        .where(
            KnowledgeChunk.client_id == client_id,
            KnowledgeSource.status == KnowledgeSourceStatus.READY,
            KnowledgeChunk.embedding.isnot(None),
        )
    )
    result = await db.execute(stmt)
    rows = result.all()

    if not rows:
        logger.info("No knowledge chunks available for RAG", client_id=str(client_id))
        return []

    # 2. Generate query embedding
    query_embedding = await embed_text(query)
    if not query_embedding:
        return []

    # 3. Build candidate list
    candidates = []
    for chunk, source_title, source_type in rows:
        if chunk.embedding and isinstance(chunk.embedding, list):
            candidates.append({
                "id": str(chunk.id),
                "content": chunk.content,
                "source_title": source_title,
                "source_type": source_type,
                "embedding": chunk.embedding,
            })

    if not candidates:
        return []

    # 4. Find most similar
    similar = find_most_similar(query_embedding, candidates, top_k=top_k)

    # 5. Format results
    results = []
    for item in similar:
        results.append({
            "content": item["content"],
            "source_title": item["source_title"],
            "source_type": item["source_type"],
        })

    logger.info(
        "RAG retrieval complete",
        query_length=len(query),
        chunks_found=len(results),
        client_id=str(client_id),
    )
    return results


def format_chunks_for_prompt(chunks: List[dict]) -> str:
    """Format retrieved chunks into a prompt-ready string."""
    if not chunks:
        return ""

    lines = ["[Relevant Knowledge Base Information]"]
    for i, chunk in enumerate(chunks, 1):
        lines.append(f"\n--- Source {i}: {chunk.get('source_title', 'Unknown')} ---")
        lines.append(chunk["content"])

    return "\n".join(lines)
