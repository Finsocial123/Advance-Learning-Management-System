
#Chats
from pydantic import BaseModel, ConfigDict, Field


class ChatBase(BaseModel):
    user_id: int
    content: str 

class ChatRequest(ChatBase):
    lesson_id: int | None = None
    web_search: bool = False
    enhance_prompt: bool = False
    pass

class ChatResponse(ChatBase):
    model_config = ConfigDict(from_attributes=True)

    content: str

