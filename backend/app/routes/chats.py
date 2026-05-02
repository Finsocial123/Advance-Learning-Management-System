import json
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.database import get_async_db, get_db, get_session_factory
from app.client import client
from app.services.rag import retrieve_context
from app.instructions import SYSTEM_PROMPT, RAG_PROMPT_TEMPLATE
from app.services.context_manager import trim_history
from app.services.tools.definitions import TOOLS
from app.services.tools.executor import execute_tool
# from app.models.chats import ChatMessage, ChatRole, ChatSession
from app.schemas.chats import ChatRequest
from app import models
from app.models.chats import ChatMessage, ChatRole, ChatSession

router = APIRouter(
    prefix="/sessions",
    tags=["Chats"]
)

#creates new session
@router.post("/{user_id}/sessions", status_code=201)
async def create_session(user_id: int, db:Annotated[AsyncSession, Depends(get_async_db)]):
    session = ChatSession(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title="New Chat"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


#get all user sessions
@router.get("/{user_id}/sessions")
async def get_sessions(user_id: int, db:Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc()))
    sessions = result.scalars().all()
    return sessions


# Get all messages from a session
@router.get("/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    db: Annotated[AsyncSession, Depends(get_async_db)]
):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    return messages


# Send a message and stream AI response
@router.post("/{session_id}/messages")
async def send_message_stream(
    session_id: str,
    request: ChatRequest,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    session_factory: Annotated[async_sessionmaker, Depends(get_session_factory)]
):
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalars().first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role=ChatRole.USER,
        content=request.content,
        user_id=request.user_id
    )
    db.add(user_msg)
    await db.commit()

    # RAG pipeline
    context = None
    if request.lesson_id is not None:
        context = await retrieve_context(
            query=request.content,
            db=db,
            lesson_id=request.lesson_id,
            top_k=4
        )
        user_content = RAG_PROMPT_TEMPLATE.format(
            context=context,
            query=request.content
        )
    else:
        user_content = request.content

    # Build history
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    history = result.scalars().all()

    raw_history = []
    for i, msg in enumerate(history):
        if i == len(history) - 1 and msg.role == ChatRole.USER:
            raw_history.append({"role": "user", "content": user_content})
        elif msg.role == ChatRole.ASSISTANT and msg.tool_calls is not None:
            raw_history.append({
                "role": "assistant",
                "content": msg.content,
                "tool_calls": msg.tool_calls
            })
        elif msg.role == ChatRole.TOOL:
            raw_history.append({
                "role": "tool",
                "tool_call_id": msg.tool_call_id,
                "content": msg.content,
            })
        else:
            raw_history.append({"role": msg.role.value, "content": msg.content})

    trimmed_history = trim_history(
        history=raw_history,
        system_prompt=SYSTEM_PROMPT,
        rag_context=context,
        max_tokens=6000
    )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + trimmed_history

    full_response = []

    async def event_generator():
        async with session_factory() as gen_db:
            try:
                first_response = await client.chat.completions.create(
                    model=request.model,
                    messages=messages,
                    tools=TOOLS,
                    tool_choice="auto",
                    stream=False
                )

                choice = first_response.choices[0]

                if choice.finish_reason == "tool_calls":
                    tool_call = choice.message.tool_calls[0]
                    tool_name = tool_call.function.name
                    tool_args = json.loads(tool_call.function.arguments)

                    yield f"data: {json.dumps({'status': 'thinking', 'tool': tool_name})}\n\n"

                    assistant_tool_msg = ChatMessage(
                        session_id=session_id,
                        role=ChatRole.ASSISTANT,
                        content=None,
                        user_id=request.user_id,
                        tool_calls=[tc.model_dump() for tc in choice.message.tool_calls],
                    )
                    gen_db.add(assistant_tool_msg)
                    await gen_db.commit()

                    tool_result = await execute_tool(tool_name, tool_args, gen_db)

                    tool_result_msg = ChatMessage(
                        session_id=session_id,
                        role=ChatRole.TOOL,
                        content=tool_result,
                        user_id=request.user_id,
                        tool_call_id=tool_call.id,
                    )
                    gen_db.add(tool_result_msg)
                    await gen_db.commit()

                    messages_with_result = messages + [
                        choice.message.model_dump(exclude_none=True),
                        {
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": tool_result
                        }
                    ]

                    final_stream = await client.chat.completions.create(
                        model=request.model,
                        messages=messages_with_result,
                        stream=True
                    )

                    async for chunk in final_stream:
                        token = chunk.choices[0].delta.content
                        if token:
                            full_response.append(token)
                            yield f"{token}"

                    final_assistant_msg = ChatMessage(
                        session_id=session_id,
                        role=ChatRole.ASSISTANT,
                        content="".join(full_response),
                        user_id=request.user_id,
                        tool_calls=None,
                    )
                    gen_db.add(final_assistant_msg)

                    stmt = select(ChatSession).where(
                        ChatSession.id == session_id
                    ).with_for_update()
                    session_to_update = (await gen_db.execute(stmt)).scalars().first()
                    if session_to_update and session_to_update.title == "New Chat":
                        session_to_update.title = request.content[:60]

                    await gen_db.commit()

                else:
                    stream = await client.chat.completions.create(
                        model=request.model,
                        messages=messages,
                        stream=True
                    )

                    async for chunk in stream:
                        token = chunk.choices[0].delta.content
                        if token:
                            full_response.append(token)
                            yield f"{token}"

                    final_assistant_msg = ChatMessage(
                        session_id=session_id,
                        role=ChatRole.ASSISTANT,
                        content="".join(full_response),
                        user_id=request.user_id
                    )
                    gen_db.add(final_assistant_msg)

                    stmt = select(ChatSession).where(
                        ChatSession.id == session_id
                    ).with_for_update()
                    session_to_update = (await gen_db.execute(stmt)).scalars().first()
                    if session_to_update and session_to_update.title == "New Chat":
                        session_to_update.title = request.content[:60]

                    await gen_db.commit()

                    yield f"data: {json.dumps({'status': 'done'})}\n\n"

            except Exception as e:
                await gen_db.rollback()
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")