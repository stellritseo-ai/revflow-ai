"""
Text embedding generation using Gemini embeddings API.
Falls back to mock embeddings in dev mode.
Cosine similarity implemented with stdlib math (no numpy needed).
"""
from __future__ import annotations
import math
from typing import List
import structlog

from app.ai.providers.gemini import gemini

logger = structlog.get_logger()


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two vectors using stdlib math."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    magnitude_a = math.sqrt(sum(a * a for a in vec_a))
    magnitude_b = math.sqrt(sum(b * b for b in vec_b))

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)


async def embed_text(text: str) -> List[float]:
    """Generate an embedding for a text string."""
    if not text or not text.strip():
        return []
    return await gemini.embed(text.strip())


async def embed_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a batch of texts sequentially."""
    results = []
    for text in texts:
        embedding = await embed_text(text)
        results.append(embedding)
    return results


def find_most_similar(
    query_embedding: List[float],
    candidates: List[dict],
    top_k: int = 5,
) -> List[dict]:
    """
    Find the most similar candidates to a query embedding.
    Each candidate must have an 'embedding' key with a float list.
    Returns top_k candidates sorted by similarity (descending).
    """
    if not query_embedding or not candidates:
        return []

    scored = []
    for candidate in candidates:
        candidate_embedding = candidate.get("embedding")
        if not candidate_embedding:
            continue
        score = cosine_similarity(query_embedding, candidate_embedding)
        scored.append((score, candidate))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:top_k]]
