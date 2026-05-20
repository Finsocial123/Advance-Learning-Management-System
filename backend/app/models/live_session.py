from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class LiveSession(Base):
    __tablename__ = "live_sessions"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    room_name = Column(String(255), unique=True, nullable=False)

    # scheduled | live | ended
    status = Column(String(20), default="scheduled", nullable=False)

    course_id = Column(Integer, ForeignKey("courses.id"), onDelete= "CASCADE", nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", backref="live_sessions")
    teacher = relationship("User", backref="live_sessions")