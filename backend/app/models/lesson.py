from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    video_url = Column(String(500), nullable=True)
    pdf_url = Column(String(500), nullable=True)
    external_video_link = Column(String(500), nullable=True)

    # Cloudinary public_ids for deletion
    video_public_id = Column(String(255), nullable=True)
    pdf_public_id = Column(String(255), nullable=True)

    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    progress_records = relationship(
        "LessonProgress",
        backref="lesson",
        cascade="all, delete-orphan"
    )