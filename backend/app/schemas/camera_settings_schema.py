from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CameraSettingsCreate(BaseModel):
    camera_id: int

    line_start_x: float = Field(default=0.0, ge=0.0, le=1.0)
    line_start_y: float = Field(default=0.6, ge=0.0, le=1.0)
    line_end_x: float = Field(default=1.0, ge=0.0, le=1.0)
    line_end_y: float = Field(default=0.6, ge=0.0, le=1.0)

    entry_direction: str = Field(default="TOP_TO_BOTTOM")
    exit_direction: str = Field(default="BOTTOM_TO_TOP")

    confidence_threshold: float = Field(default=0.50, ge=0.1, le=1.0)
    min_track_duration: float = Field(default=1.0, ge=0.0, le=10.0)

    @field_validator("entry_direction", "exit_direction")
    @classmethod
    def validate_direction(cls, value: str) -> str:
        allowed_directions = [
            "TOP_TO_BOTTOM",
            "BOTTOM_TO_TOP",
            "LEFT_TO_RIGHT",
            "RIGHT_TO_LEFT",
        ]

        value = value.upper().strip()

        if value not in allowed_directions:
            raise ValueError(
                "Direction must be TOP_TO_BOTTOM, BOTTOM_TO_TOP, LEFT_TO_RIGHT, or RIGHT_TO_LEFT"
            )

        return value


class CameraSettingsUpdate(BaseModel):
    line_start_x: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    line_start_y: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    line_end_x: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    line_end_y: Optional[float] = Field(default=None, ge=0.0, le=1.0)

    entry_direction: Optional[str] = None
    exit_direction: Optional[str] = None

    confidence_threshold: Optional[float] = Field(default=None, ge=0.1, le=1.0)
    min_track_duration: Optional[float] = Field(default=None, ge=0.0, le=10.0)

    @field_validator("entry_direction", "exit_direction")
    @classmethod
    def validate_direction(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        allowed_directions = [
            "TOP_TO_BOTTOM",
            "BOTTOM_TO_TOP",
            "LEFT_TO_RIGHT",
            "RIGHT_TO_LEFT",
        ]

        value = value.upper().strip()

        if value not in allowed_directions:
            raise ValueError(
                "Direction must be TOP_TO_BOTTOM, BOTTOM_TO_TOP, LEFT_TO_RIGHT, or RIGHT_TO_LEFT"
            )

        return value


class CameraSettingsResponse(BaseModel):
    id: int
    camera_id: int

    line_start_x: float
    line_start_y: float
    line_end_x: float
    line_end_y: float

    entry_direction: str
    exit_direction: str

    confidence_threshold: float
    min_track_duration: float

    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True