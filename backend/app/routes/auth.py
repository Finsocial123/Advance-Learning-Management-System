from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

from app.core.config import (
    EMAIL_OTP_DEBUG,
    GOOGLE_CLIENT_ID,
    OTP_EXPIRE_MINUTES,
    OTP_MAX_ATTEMPTS,
)
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    generate_otp,
    hash_otp,
    hash_password,
    verify_otp_hash,
    verify_password,
)
from app.models.auth_otp import AuthOTP
from app.models.user import User
from app.schemas.auth import (
    GoogleAuthSchema,
    LoginSchema,
    MessageResponse,
    RegisterSchema,
    ResetPasswordSchema,
    SendForgotPasswordOTPSchema,
    SendLoginOTPSchema,
    SendSignupOTPSchema,
    TokenResponse,
    VerifyLoginOTPSchema,
    VerifySignupOTPSchema,
)
from app.utils.email import send_otp_email

router = APIRouter(prefix="/auth", tags=["Auth"])


def build_token_response(user: User) -> TokenResponse:
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
    )


def create_and_send_otp(email: str, purpose: str, db: Session) -> MessageResponse:
    normalized_email = email.lower().strip()
    otp = generate_otp()

    # Expire old unused OTPs for the same email + purpose.
    db.query(AuthOTP).filter(
        AuthOTP.email == normalized_email,
        AuthOTP.purpose == purpose,
        AuthOTP.is_used == False,  # noqa: E712
    ).update({"is_used": True})

    otp_row = AuthOTP(
        email=normalized_email,
        purpose=purpose,
        code_hash=hash_otp(normalized_email, purpose, otp),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES),
    )
    db.add(otp_row)
    db.commit()

    try:
        send_otp_email(normalized_email, otp, purpose)
    except Exception as exc:
        if not EMAIL_OTP_DEBUG:
            raise HTTPException(
                status_code=500,
                detail="OTP email could not be sent. Check SMTP configuration.",
            ) from exc
        print(f"[DEV OTP] {purpose} OTP for {normalized_email}: {otp}")

    return MessageResponse(
        message="OTP sent successfully",
        dev_otp=otp if EMAIL_OTP_DEBUG else None,
    )


def verify_latest_otp(email: str, purpose: str, otp: str, db: Session) -> None:
    normalized_email = email.lower().strip()
    otp_row = (
        db.query(AuthOTP)
        .filter(
            AuthOTP.email == normalized_email,
            AuthOTP.purpose == purpose,
            AuthOTP.is_used == False,  # noqa: E712
        )
        .order_by(AuthOTP.created_at.desc())
        .first()
    )

    if not otp_row:
        raise HTTPException(status_code=400, detail="OTP not found. Please request a new OTP.")

    now = datetime.now(timezone.utc)
    expires_at = otp_row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        otp_row.is_used = True
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new OTP.")

    if otp_row.attempts >= OTP_MAX_ATTEMPTS:
        otp_row.is_used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Too many wrong attempts. Please request a new OTP.")

    if not verify_otp_hash(normalized_email, purpose, otp, otp_row.code_hash):
        otp_row.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP")

    otp_row.is_used = True
    db.commit()


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    """Password register kept for compatibility. Frontend uses OTP-verified signup."""
    normalized_email = data.email.lower().strip()
    existing = db.query(User).filter(User.email == normalized_email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=data.name.strip(),
        email=normalized_email,
        hashed_password=hash_password(data.password),
        role="student",
        auth_provider="local",
        email_verified=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return build_token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginSchema, db: Session = Depends(get_db)):
    """Main password login."""
    normalized_email = data.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return build_token_response(user)


@router.post("/send-signup-otp", response_model=MessageResponse)
def send_signup_otp(data: SendSignupOTPSchema, db: Session = Depends(get_db)):
    normalized_email = data.email.lower().strip()
    existing = db.query(User).filter(User.email == normalized_email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    return create_and_send_otp(normalized_email, "signup", db)


@router.post("/verify-signup-otp", response_model=TokenResponse)
def verify_signup_otp(data: VerifySignupOTPSchema, db: Session = Depends(get_db)):
    normalized_email = data.email.lower().strip()
    existing = db.query(User).filter(User.email == normalized_email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    verify_latest_otp(normalized_email, "signup", data.otp, db)

    user = User(
        name=data.name.strip(),
        email=normalized_email,
        hashed_password=hash_password(data.password),
        role=data.role,
        auth_provider="local",
        email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return build_token_response(user)


@router.post("/send-login-otp", response_model=MessageResponse)
def send_login_otp(data: SendLoginOTPSchema, db: Session = Depends(get_db)):
    normalized_email = data.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Account not found. Please signup first.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return create_and_send_otp(normalized_email, "login", db)


@router.post("/verify-login-otp", response_model=TokenResponse)
def verify_login_otp(data: VerifyLoginOTPSchema, db: Session = Depends(get_db)):
    normalized_email = data.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    verify_latest_otp(normalized_email, "login", data.otp, db)

    if not user.email_verified:
        user.email_verified = True
        db.commit()
        db.refresh(user)

    return build_token_response(user)


@router.post("/forgot-password/send-otp", response_model=MessageResponse)
def send_forgot_password_otp(data: SendForgotPasswordOTPSchema, db: Session = Depends(get_db)):
    normalized_email = data.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return create_and_send_otp(normalized_email, "password_reset", db)


@router.post("/forgot-password/reset", response_model=MessageResponse)
def reset_password(data: ResetPasswordSchema, db: Session = Depends(get_db)):
    normalized_email = data.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    verify_latest_otp(normalized_email, "password_reset", data.otp, db)

    user.hashed_password = hash_password(data.new_password)
    user.auth_provider = "local" if not user.google_sub else user.auth_provider
    user.email_verified = True
    db.commit()

    return MessageResponse(message="Password reset successfully")


@router.post("/google", response_model=TokenResponse)
def google_auth(data: GoogleAuthSchema, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID is not configured")

    try:
        payload = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid Google credential") from exc

    google_sub = payload.get("sub")
    email = payload.get("email")
    email_verified = payload.get("email_verified", False)
    name = payload.get("name") or (email.split("@")[0] if email else "Student")
    picture = payload.get("picture")

    if not google_sub or not email:
        raise HTTPException(status_code=401, detail="Google account data is incomplete")

    normalized_email = email.lower().strip()

    user = db.query(User).filter(User.google_sub == google_sub).first()

    if not user:
        user = db.query(User).filter(User.email == normalized_email).first()

        if user:
            # Link Google login to an existing local account with same email.
            user.google_sub = google_sub
            user.auth_provider = "google"
            user.email_verified = bool(email_verified)
            if picture and not user.avatar_url:
                user.avatar_url = picture
        else:
            user = User(
                name=name,
                email=normalized_email,
                hashed_password=None,
                role="student",
                auth_provider="google",
                google_sub=google_sub,
                email_verified=bool(email_verified),
                avatar_url=picture,
            )
            db.add(user)

        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return build_token_response(user)
