from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.services.rag import retrieve_context
from app.models.lesson import LessonChunk

async def generate_quiz(lesson_id: int, num_questions: int, db: AsyncSession) -> dict:
    """
    Fetch relevent chunks from the lesson and generate MCQ.
    Returns structured quiz data.
    """

    result = await db.execute(
        select(LessonChunk)
        .where(LessonChunk.lesson_id == lesson_id)
        .limit(10)
    )

    chunks = result.scalars().all()

    if not chunks:
        return {"error": f"No content found for lesson {lesson_id}"}
    
    combined_text = "\n\n".join(chunk.content for chunk in chunks)

    return {
        "lesson_id": lesson_id,
        "num_questions": num_questions,
        "content": combined_text,
    }