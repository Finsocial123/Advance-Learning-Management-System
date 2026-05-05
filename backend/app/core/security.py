# from datetime import datetime, timedelta, timezone
# import hashlib
# import secrets

# from jose import jwt
# from passlib.context import CryptContext

# from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)


# def verify_password(plain: str, hashed: str | None) -> bool:
#     if not hashed:
#         return False
#     return pwd_context.verify(plain, hashed)


# def create_access_token(data: dict) -> str:
#     to_encode = data.copy()

#     expire = datetime.now(timezone.utc) + timedelta(
#         minutes=ACCESS_TOKEN_EXPIRE_MINUTES
#     )

#     to_encode.update({"exp": expire})

#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# def decode_access_token(token: str) -> dict | None:
#     try:
#         return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#     except Exception:
#         return None


# def generate_otp() -> str:
#     return f"{secrets.randbelow(900000) + 100000}"


# def hash_otp(email: str, purpose: str, otp: str) -> str:
#     raw = f"{email.lower().strip()}:{purpose}:{otp}:{SECRET_KEY}"
#     return hashlib.sha256(raw.encode("utf-8")).hexdigest()


# def verify_otp_hash(email: str, purpose: str, otp: str, code_hash: str) -> bool:
#     return secrets.compare_digest(hash_otp(email, purpose, otp), code_hash)





from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from jose import jwt
from passlib.context import CryptContext

from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _prehash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    return pwd_context.hash(_prehash_password(password))


def verify_password(plain: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    return pwd_context.verify(_prehash_password(plain), hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None


def generate_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000}"


def hash_otp(email: str, purpose: str, otp: str) -> str:
    raw = f"{email.lower().strip()}:{purpose}:{otp}:{SECRET_KEY}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def verify_otp_hash(email: str, purpose: str, otp: str, code_hash: str) -> bool:
    return secrets.compare_digest(hash_otp(email, purpose, otp), code_hash)




