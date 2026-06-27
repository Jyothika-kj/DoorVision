from typing import Any, Optional

from pydantic import BaseModel, Field


class LiveActionResponse(BaseModel):
    status: str
    message: str
    camera_id: int


class LiveStatusResponse(BaseModel):
    status: str
    camera_id: int
    camera_status: Optional[str] = None
    is_running: bool
    has_frame: bool
    frame_width: Optional[int] = None
    frame_height: Optional[int] = None
    fps: float = 0.0
    last_error: Optional[str] = None
    last_frame_time: Optional[float] = None
    detection_count: int = 0
    last_events: list[dict[str, Any]] = Field(default_factory=list)


class LiveCountResponse(BaseModel):
    camera_id: int
    entry_count: int
    exit_count: int
    currently_inside: int
    is_running: bool
    detection_count: int = 0
    last_events: list[dict[str, Any]] = Field(default_factory=list)