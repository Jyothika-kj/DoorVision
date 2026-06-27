from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_entry_today: int
    total_exit_today: int
    currently_inside: int
    peak_occupancy_today: int

    total_cameras: int
    active_cameras: int
    offline_cameras: int
    error_cameras: int


class RecentEventResponse(BaseModel):
    id: int
    camera_id: int
    camera_name: Optional[str] = None
    event_type: str
    track_id: Optional[str] = None
    event_time: datetime

    class Config:
        from_attributes = True