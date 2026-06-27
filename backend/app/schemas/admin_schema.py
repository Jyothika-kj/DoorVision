from pydantic import BaseModel


class SystemHealthResponse(BaseModel):
    backend_status: str
    database_status: str
    total_cameras: int
    processing_cameras: int
    error_cameras: int
    total_events_today: int
    message: str