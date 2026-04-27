from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.progress import LessonProgress
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.models.user import User
from app.utils.dependencies import require_role

router = APIRouter(
    prefix="/progress",
    tags=["Progress"]
)


def recalculate_course_progress(
    student_id: int,
    course_id: int,
    db: Session
):
    """Recalculate and update the enrollment progress % for a student in a course."""
    total_lessons = db.query(Lesson).filter(
        Lesson.course_id == course_id
    ).count()

    if total_lessons == 0:
        return

    completed = db.query(LessonProgress).join(
        Lesson, LessonProgress.lesson_id == Lesson.id
    ).filter(
        LessonProgress.student_id == student_id,
        Lesson.course_id == course_id,
        LessonProgress.completed == True
    ).count()

    percentage = round((completed / total_lessons) * 100, 2)

    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.course_id == course_id
    ).first()

    if enrollment:
        enrollment.progress = percentage
        db.commit()


# Mark a lesson as complete
@router.post("/{lesson_id}/complete")
def mark_lesson_complete(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # check student is enrolled
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == lesson.course_id
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail="You are not enrolled in this course"
        )

    # check if already marked
    existing = db.query(LessonProgress).filter(
        LessonProgress.student_id == current_user.id,
        LessonProgress.lesson_id == lesson_id
    ).first()

    if existing:
        if existing.completed:
            return {"message": "Lesson already marked as complete"}
        existing.completed = True
        existing.completed_at = datetime.now(timezone.utc)
    else:
        progress = LessonProgress(
            student_id=current_user.id,
            lesson_id=lesson_id,
            completed=True,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(progress)

    db.commit()

    # update enrollment progress %
    recalculate_course_progress(
        current_user.id,
        lesson.course_id,
        db
    )

    return {"message": "Lesson marked as complete"}


# Mark a lesson as incomplete (undo)
@router.delete("/{lesson_id}/complete")
def mark_lesson_incomplete(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    record = db.query(LessonProgress).filter(
        LessonProgress.student_id == current_user.id,
        LessonProgress.lesson_id == lesson_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="No progress record found"
        )

    record.completed = False
    record.completed_at = None
    db.commit()

    recalculate_course_progress(
        current_user.id,
        lesson.course_id,
        db
    )

    return {"message": "Lesson marked as incomplete"}


# Get progress for a student in a course
@router.get("/course/{course_id}")
def get_course_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail="You are not enrolled in this course"
        )

    lessons = db.query(Lesson).filter(
        Lesson.course_id == course_id
    ).order_by(Lesson.order).all()

    lesson_statuses = []
    for lesson in lessons:
        record = db.query(LessonProgress).filter(
            LessonProgress.student_id == current_user.id,
            LessonProgress.lesson_id == lesson.id
        ).first()

        lesson_statuses.append({
            "lesson_id": lesson.id,
            "title": lesson.title,
            "order": lesson.order,
            "completed": record.completed if record else False,
            "completed_at": record.completed_at if record else None
        })

    return {
        "course_id": course_id,
        "overall_progress": enrollment.progress,
        "total_lessons": len(lessons),
        "completed_lessons": sum(
            1 for l in lesson_statuses if l["completed"]
        ),
        "lessons": lesson_statuses
    }