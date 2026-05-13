import sys
import asyncio

# Fix for Windows async compatibility
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import DATABASE_URL,ASYNC_DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"options": "-c search_path=public"}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ──────────────────────────────────────────
# Async engine  (used by AI chat router)
# ──────────────────────────────────────────
# psycopg v3 async driver needs a different dialect name
  # same URL, psycopg v3 supports async natively

async_engine = create_async_engine(
    ASYNC_DATABASE_URL
    # connect_args={"options": "-c search_path=public"}
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_async_db():
    async with AsyncSessionLocal() as db:
        yield db

async def get_session_factory():
    return AsyncSessionLocal