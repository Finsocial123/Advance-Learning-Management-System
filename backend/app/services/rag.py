import os
from dotenv import load_dotenv

from app.models.lesson import LessonChunk

load_dotenv()

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.client import client

async def retrieve_context(
        query: str,
        db: AsyncSession,
        lesson_id: int | None = None,
        source: str | None = None,
        top_k: int = 4
) -> str:

    response = await client.embeddings.create(
        model=os.getenv("EMBEDDING_MODEL"),
        input=query
    )

    query_embedding = response.data[0].embedding

    stmt = (
        select(LessonChunk)
        .order_by(LessonChunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    )

    if lesson_id:
        stmt = stmt.where(LessonChunk.lesson_id == lesson_id)

    if source:
        stmt = stmt.where(LessonChunk.source == source)

    result = await db.execute(stmt)
    chunks = result.scalars().all()

    if not chunks:
        return ""
    
    context_parts = [
        f"[Lesson {chunk.lesson_id} | {chunk.source} | chunk {chunk.chunk_index}]\n{chunk.content}"
        for chunk in chunks
    ]
    return "\n\n---\n\n".join(context_parts)