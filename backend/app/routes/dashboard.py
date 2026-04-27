from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.utils.dependencies import require_role

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# Admin dashboard
@router.get("/admin")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    total_users = db.query(User).count()
    total_teachers = db.query(User).filter(User.role == "teacher").count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_courses = db.query(Course).count()

    # Per-teacher stats
    teachers = db.query(User).filter(User.role == "teacher").all()
    teacher_stats = []

    for teacher in teachers:
        courses = db.query(Course).filter(
            Course.teacher_id == teacher.id
        ).all()

        teacher_stats.append({
            "teacher_id": teacher.id,
            "teacher_name": teacher.name,
            "teacher_email": teacher.email,
            "total_courses": len(courses),
            "courses": [c.title for c in courses]
        })

    # Per-student stats
    students = db.query(User).filter(User.role == "student").all()
    student_stats = []

    for student in students:
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == student.id
        ).all()

        enrolled_courses = []
        for enr in enrollments:
            course = db.query(Course).filter(
                Course.id == enr.course_id
            ).first()
            if course:
                enrolled_courses.append(course.title)

        student_stats.append({
            "student_id": student.id,
            "student_name": student.name,
            "student_email": student.email,
            "total_enrolled": len(enrollments),
            "enrolled_courses": enrolled_courses
        })

    return {
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_students": total_students,
        "total_courses": total_courses,
        "teachers": teacher_stats,
        "students": student_stats
    }


# Teacher dashboard
@router.get("/teacher")
def teacher_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    courses = db.query(Course).filter(
        Course.teacher_id == current_user.id
    ).all()

    total_lessons = 0
    total_enrolled_students = 0
    course_stats = []

    for course in courses:
        lessons = db.query(Lesson).filter(
            Lesson.course_id == course.id
        ).all()

        enrollments = db.query(Enrollment).filter(
            Enrollment.course_id == course.id
        ).all()

        total_lessons += len(lessons)
        total_enrolled_students += len(enrollments)

        student_progress = []
        for enr in enrollments:
            student = db.query(User).filter(
                User.id == enr.student_id
            ).first()

            if student:
                student_progress.append({
                    "student_id": student.id,
                    "student_name": student.name,
                    "progress": enr.progress
                })

        course_stats.append({
            "course_id": course.id,
            "course_title": course.title,
            "total_lessons": len(lessons),
            "total_enrolled": len(enrollments),
            "students": student_progress
        })

    return {
        "total_courses": len(courses),
        "total_lessons": total_lessons,
        "total_enrolled_students": total_enrolled_students,
        "courses": course_stats
    }


# Student dashboard
@router.get("/student")
def student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id
    ).all()

    course_data = []

    for enr in enrollments:
        course = db.query(Course).filter(
            Course.id == enr.course_id
        ).first()

        if not course:
            continue

        teacher = db.query(User).filter(
            User.id == course.teacher_id
        ).first()

        total_lessons = db.query(Lesson).filter(
            Lesson.course_id == course.id
        ).count()

        completed_lessons = db.query(LessonProgress).join(
            Lesson, LessonProgress.lesson_id == Lesson.id
        ).filter(
            LessonProgress.student_id == current_user.id,
            Lesson.course_id == course.id,
            LessonProgress.completed == True
        ).count()

        course_data.append({
            "course_id": course.id,
            "course_title": course.title,
            "teacher_name": teacher.name if teacher else None,
            "progress": enr.progress,
            "completed_lessons": completed_lessons,
            "total_lessons": total_lessons
        })

    return {
        "total_enrolled": len(enrollments),
        "courses": course_data
    }