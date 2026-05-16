from datetime import timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from livekit import api

from app.core.database import get_db
from app.core.config import LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.live_session import LiveSession
from app.models.notification import Notification
from app.models.user import User
from app.utils.dependencies import get_current_user, require_role

router = APIRouter(prefix="/live-sessions", tags=["Live Sessions"])


def create_livekit_token(
    *,
    room_name: str,
    user: User,
    can_publish: bool,
) -> str:
    if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
        raise HTTPException(status_code=500, detail="LiveKit keys are missing")

    token = (
        api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        .with_identity(f"user-{user.id}")
        .with_name(user.name)
        .with_ttl(timedelta(hours=3))
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=can_publish,
                can_subscribe=True,
                can_publish_data=True,
            )
        )
        .to_jwt()
    )

    return token


@router.post("/course/{course_id}/start")
def start_live_session(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"])),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role != "admin" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your course")

    existing_live = db.query(LiveSession).filter(
        LiveSession.course_id == course_id,
        LiveSession.status == "live",
    ).first()

    if existing_live:
        session = existing_live
    else:
        session = LiveSession(
            title=f"Live class - {course.title}",
            room_name=f"course-{course_id}-{uuid4().hex[:10]}",
            status="live",
            course_id=course_id,
            teacher_id=current_user.id,
            started_at=func.now(),
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        enrollments = db.query(Enrollment).filter(
            Enrollment.course_id == course_id
        ).all()

        notifications = [
            Notification(
                user_id=enrollment.student_id,
                title="Live class started",
                message=f"{course.title} is live now. Join the class.",
                notification_type="live_started",
                link=f"/courses/{course_id}/live",
            )
            for enrollment in enrollments
        ]

        if notifications:
            db.add_all(notifications)
            db.commit()

    token = create_livekit_token(
        room_name=session.room_name,
        user=current_user,
        can_publish=True,
    )

    return {
        "session_id": session.id,
        "title": session.title,
        "room_name": session.room_name,
        "status": session.status,
        "livekit_url": LIVEKIT_URL,
        "token": token,
        "can_publish": True,
    }


@router.get("/course/{course_id}/active")
def get_active_live_session(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role == "student":
        enrollment = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.student_id == current_user.id,
        ).first()

        if not enrollment:
            raise HTTPException(
                status_code=403,
                detail="You are not enrolled in this course",
            )

    elif current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your course")

    session = db.query(LiveSession).filter(
        LiveSession.course_id == course_id,
        LiveSession.status == "live",
    ).first()

    if not session:
        return {"active": False}

    can_publish = current_user.role in ["teacher", "admin"]

    token = create_livekit_token(
        room_name=session.room_name,
        user=current_user,
        can_publish=can_publish,
    )

    return {
        "active": True,
        "session_id": session.id,
        "title": session.title,
        "room_name": session.room_name,
        "status": session.status,
        "livekit_url": LIVEKIT_URL,
        "token": token,
        "can_publish": can_publish,
    }


@router.patch("/{session_id}/end")
def end_live_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"])),
):
    session = db.query(LiveSession).filter(LiveSession.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Live session not found")

    course = db.query(Course).filter(Course.id == session.course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role != "admin" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your live session")

    session.status = "ended"
    session.ended_at = func.now()

    db.commit()

    return {"message": "Live session ended"}