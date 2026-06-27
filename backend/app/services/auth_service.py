from sqlalchemy.orm import Session

from app.models.user_model import User
from app.schemas.user_schema import UserCreate
from app.utils.security import hash_password, verify_password
from app.utils.jwt_handler import create_access_token


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


def create_user(db: Session, user_data: UserCreate) -> User:
    email = user_data.email.lower()

    existing_user = get_user_by_email(db, email)

    if existing_user:
        raise ValueError("Email already registered")

    new_user = User(
        name=user_data.name.strip(),
        email=email,
        password_hash=hash_password(user_data.password),
        role=user_data.role.upper(),
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)

    if not user:
        return None

    if not user.is_active:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def create_login_token(user: User) -> str:
    token_data = {
        "sub": user.email,
        "user_id": user.id,
        "role": user.role,
    }

    return create_access_token(token_data)