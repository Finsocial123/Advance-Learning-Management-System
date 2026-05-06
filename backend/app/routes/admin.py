from math import ceil
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.progress import LessonProgress
from app.models.user import User
from app.schemas.user import UserOut, UserRoleUpdate
from app.utils.dependencies import require_role

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

VALID_ROLES = ["student", "teacher", "admin"]


def serialize_user(user: User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "is_active": user.is_active,
    }


@router.get("/users")
def get_paginated_users(
    role: Literal["teacher", "student"] = Query(...),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Return role-based users with pagination and light dashboard stats."""

    query = db.query(User).filter(User.role == role)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.name.ilike(pattern),
                User.email.ilike(pattern),
            )
        )

    total = query.count()
    offset = (page - 1) * limit
    users = (
        query
        .order_by(User.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    for user in users:
        item = serialize_user(user)

        if role == "teacher":
            item["total_courses"] = db.query(Course).filter(
                Course.teacher_id == user.id
            ).count()
        else:
            total_enrolled_courses = db.query(Enrollment).filter(
                Enrollment.student_id == user.id
            ).count()
            average_progress = db.query(func.coalesce(func.avg(Enrollment.progress), 0)).filter(
                Enrollment.student_id == user.id
            ).scalar() or 0

            item["total_enrolled_courses"] = total_enrolled_courses
            item["average_progress"] = round(float(average_progress), 2)

        items.append(item)

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": ceil(total / limit) if total else 1,
    }


@router.get("/users/{user_id}/details")
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Return full admin profile detail for a teacher or student."""

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    response = {
        "user": serialize_user(user),
        "teacher_report": None,
        "student_report": None,
    }

    if user.role == "teacher":
        courses = db.query(Course).filter(
            Course.teacher_id == user.id
        ).order_by(Course.created_at.desc()).all()

        course_items = []
        for course in courses:
            total_lessons = db.query(Lesson).filter(
                Lesson.course_id == course.id
            ).count()
            total_enrolled_students = db.query(Enrollment).filter(
                Enrollment.course_id == course.id
            ).count()

            course_items.append({
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "thumbnail_url": course.thumbnail_url,
                "total_lessons": total_lessons,
                "total_enrolled_students": total_enrolled_students,
                "created_at": course.created_at,
            })

        response["teacher_report"] = {
            "total_courses": len(course_items),
            "courses": course_items,
        }

    if user.role == "student":
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == user.id
        ).order_by(Enrollment.enrolled_at.desc()).all()

        course_reports = []
        progress_values = []

        for enrollment in enrollments:
            course = db.query(Course).filter(
                Course.id == enrollment.course_id
            ).first()

            if not course:
                continue

            teacher = db.query(User).filter(User.id == course.teacher_id).first()
            lessons = db.query(Lesson).filter(
                Lesson.course_id == course.id
            ).order_by(Lesson.order.asc(), Lesson.id.asc()).all()

            lesson_items = []
            completed_lessons = 0

            for lesson in lessons:
                record = db.query(LessonProgress).filter(
                    LessonProgress.student_id == user.id,
                    LessonProgress.lesson_id == lesson.id,
                ).first()

                is_completed = bool(record.completed) if record else False
                if is_completed:
                    completed_lessons += 1

                lesson_items.append({
                    "lesson_id": lesson.id,
                    "title": lesson.title,
                    "order": lesson.order,
                    "completed": is_completed,
                    "completed_at": record.completed_at if record else None,
                })

            total_lessons = len(lessons)
            progress = (
                round((completed_lessons / total_lessons) * 100, 2)
                if total_lessons > 0
                else round(float(enrollment.progress or 0), 2)
            )
            progress_values.append(progress)

            course_reports.append({
                "course_id": course.id,
                "course_title": course.title,
                "teacher_name": teacher.name if teacher else "Unknown Teacher",
                "progress": progress,
                "total_lessons": total_lessons,
                "completed_lessons": completed_lessons,
                "pending_lessons": max(total_lessons - completed_lessons, 0),
                "lessons": lesson_items,
            })

        response["student_report"] = {
            "total_enrolled_courses": len(course_reports),
            "average_progress": round(
                sum(progress_values) / len(progress_values), 2
            ) if progress_values else 0,
            "courses": course_reports,
        }

    return response


# Promote or demote a user's role
@router.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    if data.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Choose from: {VALID_ROLES}"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role"
        )

    user.role = data.role
    db.commit()
    db.refresh(user)

    return user


# Delete a user account
# @router.delete("/users/{user_id}")
# def delete_user(
#     user_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_role(["admin"]))
# ):
#     user = db.query(User).filter(User.id == user_id).first()

#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     if user.id == current_user.id:
#         raise HTTPException(
#             status_code=400,
#             detail="You cannot delete your own account"
#         )

#     user.is_active = False
#     db.commit()

#     return {"message": f"User '{user.name}' deactivated successfully"}


# Deactivate / reactivate a user
@router.put("/users/{user_id}/toggle-active", response_model=UserOut)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account"
        )

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    return user


# Platform-wide stats summary
@router.get("/stats")
def get_platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    total_users = db.query(User).count()
    total_teachers = db.query(User).filter(User.role == "teacher").count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_admins = db.query(User).filter(User.role == "admin").count()
    total_courses = db.query(Course).count()
    total_enrollments = db.query(Enrollment).count()

    return {
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_students": total_students,
        "total_admins": total_admins,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments
    }
