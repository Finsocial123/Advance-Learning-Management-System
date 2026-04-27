from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.core.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.course import CourseOut
from app.utils.dependencies import get_current_user, require_role
from app.utils.cloudinary import upload_file, delete_file

router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)


def build_course_out(course: Course) -> dict:
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "thumbnail_url": course.thumbnail_url,
        "teacher_id": course.teacher_id,
        "teacher_name": course.teacher.name if course.teacher else None,
        "created_at": course.created_at
    }


# Create course
@router.post("/")
def create_course(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    thumbnail: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    thumbnail_url = None

    if thumbnail:
        result = upload_file(
            thumbnail.file,
            folder="lms/thumbnails",
            resource_type="image"
        )
        thumbnail_url = result["url"]

    course = Course(
        title=title,
        description=description,
        thumbnail_url=thumbnail_url,
        teacher_id=current_user.id
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    return {
        "message": "Course created successfully",
        "course_id": course.id
    }


# Get all courses with optional search
@router.get("/")
def get_all_courses(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Course)

    if search:
        query = query.filter(
            or_(
                Course.title.ilike(f"%{search}%"),
                Course.description.ilike(f"%{search}%")
            )
        )

    courses = query.all()
    return [build_course_out(c) for c in courses]


# Get courses created by the logged-in teacher/admin
@router.get("/my-created")
def get_my_created_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    courses = db.query(Course).filter(
        Course.teacher_id == current_user.id
    ).all()

    return [build_course_out(c) for c in courses]


# Get single course
@router.get("/{course_id}")
def get_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return build_course_out(course)


# Update course
@router.put("/{course_id}")
def update_course(
    course_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    thumbnail: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role != "admin" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your course")

    if title:
        course.title = title

    if description is not None:
        course.description = description

    if thumbnail:
        result = upload_file(
            thumbnail.file,
            folder="lms/thumbnails",
            resource_type="image"
        )
        course.thumbnail_url = result["url"]

    db.commit()
    db.refresh(course)

    return {"message": "Course updated successfully"}


# Delete course
@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role != "admin" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your course")

    db.delete(course)
    db.commit()

    return {"message": "Course deleted successfully"}


# Get students enrolled in a course (teacher/admin)
@router.get("/{course_id}/students")
def get_enrolled_students(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role != "admin" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your course")

    enrollments = db.query(Enrollment).filter(
        Enrollment.course_id == course_id
    ).all()

    result = []
    for enr in enrollments:
        student = db.query(User).filter(User.id == enr.student_id).first()
        if student:
            result.append({
                "student_id": student.id,
                "student_name": student.name,
                "student_email": student.email,
                "progress": enr.progress,
                "enrolled_at": enr.enrolled_at
            })

    return result