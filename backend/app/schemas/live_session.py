from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


LiveSessionStatus = Literal["scheduled", "live", "ended"]


class LiveSessionOut(BaseModel):
    id: int
    title: str
    room_name: str
    status: LiveSessionStatus
    course_id: int
    teacher_id: int
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LiveSessionTokenResponse(BaseModel):
    session_id: int
    title: str
    room_name: str
    status: LiveSessionStatus
    livekit_url: str
    token: str
    can_publish: Optional[bool] = None


class ActiveLiveSessionResponse(LiveSessionTokenResponse):
    active: Literal[True] = True


class NoActiveLiveSessionResponse(BaseModel):
    active: Literal[False] = False


class EndLiveSessionResponse(BaseModel):
    message: str