
#Chats
from pydantic import BaseModel, ConfigDict, Field


class ChatBase(BaseModel):
    user_id: int
    model: str = Field(max_length=50, default="openrouter/free")
    content: str 

class ChatRequest(ChatBase):
    lesson_id: int | None = None
    pass

class ChatResponse(ChatBase):
    model_config = ConfigDict(from_attributes=True)

    content: str

