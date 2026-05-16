import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base

from app.models import (
    User, AuthOTP, Course, Lesson,
    Assignment, Submission,
    Enrollment, LessonProgress, VideoWatchProgress,
    LiveSession, Notification
)

from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.admin import router as admin_router
from app.routes.courses import router as courses_router
from app.routes.lessons import router as lessons_router
from app.routes.assignments import router as assignments_router
from app.routes.enrollments import router as enrollments_router
from app.routes.progress import router as progress_router
from app.routes.dashboard import router as dashboard_router
from app.routes.chats import router as chats_router
from app.routes.live_sessions import router as live_sessions_router
from app.routes.notifications import router as notifications_router

app = FastAPI(
    title="LMS API",
    version="2.0.0",
    description="Learning Management System with role-based access",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(courses_router)
app.include_router(lessons_router)
app.include_router(assignments_router)
app.include_router(enrollments_router)
app.include_router(progress_router)
app.include_router(dashboard_router)
app.include_router(chats_router)
app.include_router(live_sessions_router)
app.include_router(notifications_router)



@app.get("/")
def root():
    return {"message": "LMS API v2.0 is running"}


@app.get("/health")
def health():
    return {"status": "ok"}