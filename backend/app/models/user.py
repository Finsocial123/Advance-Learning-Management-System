from sqlalchemy import Column, Integer, String, Boolean, Text
from app.core.database import Base
from sqlalchemy.orm import relationship



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    # Nullable because Google-only users may not have a local password.
    hashed_password = Column(String(255), nullable=True)

    # local | google
    auth_provider = Column(String(30), default="local", nullable=False)
    google_sub = Column(String(255), unique=True, index=True, nullable=True)
    email_verified = Column(Boolean, default=False, nullable=False)

    # student | teacher | admin
    role = Column(String(20), default="student", nullable=False)

    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
