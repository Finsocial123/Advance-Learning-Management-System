import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.tools.quiz_generator import generate_quiz
from app.services.tools.summarizer import summarize_lesson

async def execute_tool(tool_name: str, tool_args: dict, db: AsyncSession) -> str:
    """
    Execute a tool call from the LLM and return result as string
    """

    if tool_name == "quiz_generator":
        result = await generate_quiz(
            lesson_id=tool_args.get("lesson_id"),
            num_questions=tool_args.get("num_questions", 5),
            difficulty=tool_args.get("difficulty", "medium"),
            db=db,
            include_answers=False
        )
        return json.dumps(result)

    return json.dumps({"error": f"Unknown tool: {tool_name}"})

