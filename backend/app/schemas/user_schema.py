from datetime import datetime
import re

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Full name of the admin user",
    )

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=64,
        description="Password must be 8-64 characters",
    )

    role: str = Field(default="ADMIN")

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Name is required")

        if len(value) < 2:
            raise ValueError("Name must be at least 2 characters")

        if not re.match(r"^[A-Za-z\s.'-]+$", value):
            raise ValueError("Name can only contain letters, spaces, dot, apostrophe, and hyphen")

        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")

        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter")

        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one number")

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=/\\]", value):
            raise ValueError("Password must contain at least one special character")

        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        allowed_roles = ["ADMIN", "VIEWER", "TECHNICIAN"]

        value = value.upper().strip()

        if value not in allowed_roles:
            raise ValueError("Role must be ADMIN, VIEWER, or TECHNICIAN")

        return value


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True