from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.services.rag import retrieve_context
from app.models.lesson import LessonChunk
from app.client import client
import json

# async def generate_quiz(lesson_id: int, num_questions: int, db: AsyncSession) -> dict:
#     """
#     Fetch relevent chunks from the lesson and generate MCQ.
#     Returns structured quiz data.
#     """

#     result = await db.execute(
#         select(LessonChunk)
#         .where(LessonChunk.lesson_id == lesson_id)
#         .limit(10)
#     )

#     chunks = result.scalars().all()

#     if not chunks:
#         return {"error": f"No content found for lesson {lesson_id}"}
    
#     combined_text = "\n\n".join(chunk.content for chunk in chunks)

#     return {
#         "lesson_id": lesson_id,
#         "num_questions": num_questions,
#         "content": combined_text,
#     }



DIFFICULTY_PROMPTS = {
    "easy": "Generate simple recall questions. Focus on basic definitions and key facts.",
    "medium": "Generate questions that require understanding concepts, not just memorization.",
    "hard": "Generate questions that require deep analysis, application, and connecting multiple concepts."
}


async def generate_quiz(
    lesson_id: int,
    num_questions: int,
    difficulty: str,
    db: AsyncSession
) -> dict:
    chunks = (await db.execute(
        select(LessonChunk)
        .where(LessonChunk.lesson_id == lesson_id)
        .limit(10)
    )).scalars().all()

    if not chunks:
        return {"error": f"No content found for lesson {lesson_id}"}

    combined_text = "\n\n".join(chunk.content for chunk in chunks)
    difficulty_instruction = DIFFICULTY_PROMPTS.get(difficulty, DIFFICULTY_PROMPTS["medium"])

    response = await client.chat.completions.create(
        model="anthropic/claude-sonnet-4-5",
        messages=[
            {
                "role": "system",
                "content": """You are a quiz generator. Always respond with valid JSON only.
No markdown, no explanation, just the JSON object."""
            },
            {
                "role": "user",
                "content": f"""Generate {num_questions} multiple choice questions from this content.

Difficulty: {difficulty.upper()}
Instructions: {difficulty_instruction}

Content:
{combined_text}

Return this exact JSON structure:
{{
    "lesson_id": {lesson_id},
    "difficulty": "{difficulty}",
    "questions": [
        {{
            "question_number": 1,
            "question": "question text here",
            "options": {{
                "A": "option text",
                "B": "option text",
                "C": "option text",
                "D": "option text"
            }},
            "correct_answer": "A",
            "explanation": "why this answer is correct"
        }}
    ]
}}"""
            }
        ]
    )

    raw = response.choices[0].message.content.strip()

    # strip markdown fences if model adds them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    return json.loads(raw)