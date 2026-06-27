from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CameraCreate(BaseModel):
    camera_name: str = Field(..., min_length=2, max_length=120)
    location: Optional[str] = Field(default=None, max_length=200)
    camera_type: str = Field(default="IP_CAMERA", max_length=50)

    rtsp_url: str = Field(..., min_length=1)
    username: Optional[str] = Field(default=None, max_length=100)
    password: Optional[str] = Field(default=None, max_length=255)

    @field_validator("camera_name")
    @classmethod
    def validate_camera_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Camera name is required")

        return value

    @field_validator("camera_type")
    @classmethod
    def validate_camera_type(cls, value: str) -> str:
        allowed_types = ["IP_CAMERA", "CCTV_DVR", "WEBCAM", "VIDEO_FILE"]

        value = value.upper().strip()

        if value not in allowed_types:
            raise ValueError("Camera type must be IP_CAMERA, CCTV_DVR, WEBCAM, or VIDEO_FILE")

        return value

    @field_validator("rtsp_url")
    @classmethod
    def validate_rtsp_url(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("RTSP URL is required")

        if not (
            value.startswith("rtsp://")
            or value.startswith("http://")
            or value.startswith("https://")
            or value == "0"
        ):
            raise ValueError("Camera URL must start with rtsp://, http://, https://, or use 0 for webcam")

        return value


class CameraUpdate(BaseModel):
    camera_name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    location: Optional[str] = Field(default=None, max_length=200)
    camera_type: Optional[str] = Field(default=None, max_length=50)

    rtsp_url: Optional[str] = Field(default=None, min_length=1)
    username: Optional[str] = Field(default=None, max_length=100)
    password: Optional[str] = Field(default=None, max_length=255)
    status: Optional[str] = Field(default=None, max_length=30)

    @field_validator("camera_type")
    @classmethod
    def validate_camera_type(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        allowed_types = ["IP_CAMERA", "CCTV_DVR", "WEBCAM", "VIDEO_FILE"]

        value = value.upper().strip()

        if value not in allowed_types:
            raise ValueError("Camera type must be IP_CAMERA, CCTV_DVR, WEBCAM, or VIDEO_FILE")

        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        allowed_status = ["CONNECTED", "OFFLINE", "ERROR", "PROCESSING", "STOPPED"]

        value = value.upper().strip()

        if value not in allowed_status:
            raise ValueError("Status must be CONNECTED, OFFLINE, ERROR, PROCESSING, or STOPPED")

        return value


class CameraResponse(BaseModel):
    id: int
    camera_name: str
    location: Optional[str]
    camera_type: str
    rtsp_url: str
    username: Optional[str]
    status: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class CameraTestRequest(BaseModel):
    rtsp_url: str = Field(..., min_length=1)


class CameraTestResponse(BaseModel):
    status: str
    connected: bool
    message: str
    frame_width: Optional[int] = None
    frame_height: Optional[int] = None
    fps: Optional[float] = None