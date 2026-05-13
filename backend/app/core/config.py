import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

MODEL = os.getenv("MODEL")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
TRANSCRIPTION_MODEL = os.getenv("TRANSCRIPTION_MODEL")

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing in backend/.env")
ASYNC_DATABASE_URL = os.getenv("ASYNC_DATABASE_URL")

ASYNC_DATABASE_URL = os.getenv("ASYNC_DATABASE_URL")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is missing in backend/.env")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

OTP_EXPIRE_MINUTES = int(os.getenv("OTP_EXPIRE_MINUTES", 10))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", 5))
EMAIL_OTP_DEBUG = os.getenv("EMAIL_OTP_DEBUG", "false").lower() == "true"

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME or "no-reply@example.com")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "LMS")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")