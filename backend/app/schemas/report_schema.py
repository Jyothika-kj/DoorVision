from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class DailyReportResponse(BaseModel):
    id: int
    camera_id: int
    camera_name: Optional[str] = None
    report_date: date
    total_entry: int
    total_exit: int
    currently_inside: int
    peak_occupancy: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class HourlyReportItem(BaseModel):
    hour: int
    entry_count: int
    exit_count: int


class HourlyReportResponse(BaseModel):
    camera_id: Optional[int] = None
    report_date: date
    hourly_data: list[HourlyReportItem]