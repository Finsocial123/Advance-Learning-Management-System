from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
import httpx
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.lesson import Lesson
from app.models.course import Course
from app.models.user import User
from app.schemas.lesson import LessonOut
from app.utils.dependencies import get_current_user, require_role
from app.utils.cloudinary import upload_file, delete_file
from app.services.embedder import chunk_and_embed_lesson
from app.services.extractor import extract_text_from_pdf
from app.services.transcriber import transcribe_video

router = APIRouter(
    prefix="/lessons",
    tags=["Lessons"]
)


def course_owner_or_admin(course: Course, user: User):
    if user.role != "admin" and course.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Not your course")


# Create lesson inside a course
@router.post("/{course_id}")
async def create_lesson(
    course_id: int,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    order: Optional[int] = Form(0),
    external_video_link: Optional[str] = Form(None),
    video: Optional[UploadFile] = File(None),
    pdf: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course_owner_or_admin(course, current_user)

    video_url = None
    video_public_id = None
    pdf_url = None
    pdf_public_id = None

    if video:
        result = upload_file(
            video.file,
            folder="lms/videos",
            resource_type="video"
        )
        video_url = result["url"]
        video_public_id = result["public_id"]

    if pdf:
        result = upload_file(
            pdf.file,
            folder="lms/pdfs",
            resource_type="raw"
        )
        pdf_url = result["url"]
        pdf_public_id = result["public_id"]

    lesson = Lesson(
        title=title,
        description=description,
        order=order,
        external_video_link=external_video_link,
        video_url=video_url,
        video_public_id=video_public_id,
        pdf_url=pdf_url,
        pdf_public_id=pdf_public_id,
        course_id=course_id
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    # embed PDF content if a PDF was uploaded
    if video_url: 
        # Transcribe via Whisper
        try:
            transcript = await transcribe_video(video_url)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Transcription failed: {str(e)}")

        if not transcript:
            raise HTTPException(status_code=422, detail="Could not transcribe video")

        lesson.video_url = video_url         #Save the video URL
        lesson.transcript = transcript      #trascript of video
        db.commit()

        chunk_count = await chunk_and_embed_lesson(
            lesson_id=lesson.id,
            text=transcript,
            source="transcript",    # only difference from PDF
            db=db
        )
        db.commit()
        return {
            "lesson_id": lesson.id,
            "video_url": video_url,
            "transcript_preview": transcript[:200],
            "chunks_created": chunk_count,
            "message": "Video uploaded, transcribed and embedded successfully"
        }

    if pdf_url:
        async with httpx.AsyncClient() as client:
            response = await client.get(pdf_url)
            pdf_bytes = response.content

        text = extract_text_from_pdf(pdf_bytes)

        if text:
            lesson.notes = text
            chunks_count  = await chunk_and_embed_lesson(
                lesson_id=lesson.id,
                text=text,
                source="notes",
                db=db
            )
            db.commit()
            return {
                "lesson_id": lesson.id,
                "characters": len(text),
                "chunks_created": chunks_count,
                "preview": text[:200],
                "message": "PDF processed and embedded successfully"
            }
        
    return {
        "message": "Lesson created successfully",
        "lesson_id": lesson.id
    }
    


# Get all lessons for a course
@router.get("/course/{course_id}")
def get_course_lessons(
    course_id: int,
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    lessons = db.query(Lesson).filter(
        Lesson.course_id == course_id
    ).order_by(Lesson.order).all()

    return lessons


# Get single lesson
@router.get("/{lesson_id}")
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return lesson


# Update lesson
@router.put("/{lesson_id}")
def update_lesson(
    lesson_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    order: Optional[int] = Form(None),
    external_video_link: Optional[str] = Form(None),
    video: Optional[UploadFile] = File(None),
    pdf: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    course_owner_or_admin(course, current_user)

    if title:
        lesson.title = title

    if description is not None:
        lesson.description = description

    if order is not None:
        lesson.order = order

    if external_video_link is not None:
        lesson.external_video_link = external_video_link

    if video:
        # delete old video
        if lesson.video_public_id:
            delete_file(lesson.video_public_id, resource_type="video")

        result = upload_file(
            video.file,
            folder="lms/videos",
            resource_type="video"
        )
        lesson.video_url = result["url"]
        lesson.video_public_id = result["public_id"]

    if pdf:
        # delete old pdf
        if lesson.pdf_public_id:
            delete_file(lesson.pdf_public_id, resource_type="raw")

        result = upload_file(
            pdf.file,
            folder="lms/pdfs",
            resource_type="raw"
        )
        lesson.pdf_url = result["url"]
        lesson.pdf_public_id = result["public_id"]

    db.commit()
    db.refresh(lesson)

    return {"message": "Lesson updated successfully"}


# Delete lesson
@router.delete("/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    course_owner_or_admin(course, current_user)

    # clean up cloudinary files
    if lesson.video_public_id:
        delete_file(lesson.video_public_id, resource_type="video")

    if lesson.pdf_public_id:
        delete_file(lesson.pdf_public_id, resource_type="raw")

    db.delete(lesson)
    db.commit()

    return {"message": "Lesson deleted successfully"}