from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app import models


async def summarize_lesson(lesson_id: int, db: AsyncSession) -> dict:
    """
    Fetch all chunks for a lesson and return them for summarization
    """

    result = await db.execute(
        select(models.LessonChunk)
        .where(models.LessonChunk.lesson_id == lesson_id)
        .order_by(models.LessonChunk.chunk_index)
        )
    
    chunks = result.scalars.all()

    if not chunks:
        return {"error": f"No content found for lesson {lesson_id}"}
    
    combined_text = "\n\n".join(chunk.content for chunk in chunks)

    return {
        "lesson_id": lesson_id,
        "content": combined_text
    }