from dotenv import load_dotenv
load_dotenv()

from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session
from sqlalchemy import delete
import os

from app.client import client
from app.models.lesson import LessonChunk  


splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", ".", " "]
)


async def chunk_and_embed_lesson(lesson_id: int, text: str, source: str, db: Session) -> int:
    """
    Chunk text, embed each chunk, store in DB.
    Returns number of chunks created.
    """

    await db.execute(                                 
        delete(LessonChunk).where(                   
            LessonChunk.lesson_id == lesson_id,
            LessonChunk.source == source
        )
    )

    chunks = splitter.split_text(text)
    if not chunks:
        return 0

    response = await client.embeddings.create(
        model=os.getenv("EMBEDDING_MODEL"),
        input=chunks
    )

    embeddings = [item.embedding for item in response.data]

    db_chunks = [
        LessonChunk(                             
            lesson_id=lesson_id,
            content=chunk_text,
            source=source,
            chunk_index=idx,
            embedding=embedding
        )
        for idx, (chunk_text, embedding) in enumerate(zip(chunks, embeddings))
    ]

    db.add_all(db_chunks)
    await db.commit()

    return len(db_chunks)