from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.utils.dependencies import get_current_user, require_role
from app.utils.cloudinary import upload_file, delete_file

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me", response_model=UserOut)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.put("/me", response_model=UserOut)
def update_my_profile(
    name: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if name:
        current_user.name = name

    if bio is not None:
        current_user.bio = bio

    if avatar:
        # delete old avatar from cloudinary if exists
        if current_user.avatar_url and hasattr(current_user, "avatar_public_id"):
            delete_file(current_user.avatar_public_id, resource_type="image")

        result = upload_file(
            avatar.file,
            folder="lms/avatars",
            resource_type="image"
        )
        current_user.avatar_url = result["url"]

    db.commit()
    db.refresh(current_user)

    return current_user


# Admin: get all users
@router.get("/", response_model=list[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    return db.query(User).all()


# Admin: get single user
@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user