from typing import Literal
import re

from pydantic import BaseModel, EmailStr, Field, field_validator


PASSWORD_ERROR = (
    "Password must be at least 8 characters long, contain at least "
    "one capital letter, and one special character."
)


def validate_strong_password(password: str) -> str:
    """
    Strong password rule:
    - Minimum 8 characters
    - At least one capital letter
    - At least one special character
    """

    if len(password) < 8:
        raise ValueError(PASSWORD_ERROR)

    if not re.search(r"[A-Z]", password):
        raise ValueError(PASSWORD_ERROR)

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\;/`~']", password):
        raise ValueError(PASSWORD_ERROR)

    return password


class RegisterSchema(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, password: str) -> str:
        return validate_strong_password(password)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class SendSignupOTPSchema(BaseModel):
    email: EmailStr


class VerifySignupOTPSchema(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["student", "teacher"] = "student"
    otp: str = Field(min_length=6, max_length=6)

    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, password: str) -> str:
        return validate_strong_password(password)


class SendLoginOTPSchema(BaseModel):
    email: EmailStr


class VerifyLoginOTPSchema(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class SendForgotPasswordOTPSchema(BaseModel):
    email: EmailStr


class ResetPasswordSchema(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def new_password_must_be_strong(cls, password: str) -> str:
        return validate_strong_password(password)


class GoogleAuthSchema(BaseModel):
    credential: str


class MessageResponse(BaseModel):
    message: str
    dev_otp: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    email: EmailStr
    avatar_url: str | None = None