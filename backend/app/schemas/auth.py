from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class RegisterSchema(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class SendSignupOTPSchema(BaseModel):
    email: EmailStr


class VerifySignupOTPSchema(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: Literal["student", "teacher"] = "student"
    otp: str = Field(min_length=6, max_length=6)


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
    new_password: str = Field(min_length=6, max_length=128)


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
