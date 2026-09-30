"""
User service — business logic for user management.
"""
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, data: UserCreate) -> User:
        if self.get_by_email(data.email):
            raise HTTPException(status_code=400, detail="A user with this email already exists.")
        user = User(
            email=data.email,
            hashed_password=get_password_hash(data.password),
            role=data.role,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate(self, email: str, password: str) -> Optional[User]:
        """Return the User if credentials are valid, else None."""
        user = self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def deactivate(self, user_id: int) -> User:
        user = self.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_active = False
        self.db.commit()
        self.db.refresh(user)
        return user
