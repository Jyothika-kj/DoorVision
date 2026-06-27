from datetime import date, datetime, time

from sqlalchemy.orm import Session

from app.database import test_database_connection
from app.models.camera_model import Camera
from app.models.count_event_model import CountEvent


def get_system_health(db: Session) -> dict:
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)

    database_ok = test_database_connection()

    total_cameras = db.query(Camera).count()

    processing_cameras = (
        db.query(Camera)
        .filter(Camera.status == "PROCESSING")
        .count()
    )

    error_cameras = (
        db.query(Camera)
        .filter(Camera.status == "ERROR")
        .count()
    )

    total_events_today = (
        db.query(CountEvent)
        .filter(CountEvent.event_time >= today_start)
        .filter(CountEvent.event_time <= today_end)
        .count()
    )

    if database_ok and error_cameras == 0:
        message = "System is running normally."
    elif not database_ok:
        message = "Database connection issue detected."
    else:
        message = "Some cameras have errors. Please check camera connection."

    return {
        "backend_status": "RUNNING",
        "database_status": "CONNECTED" if database_ok else "ERROR",
        "total_cameras": total_cameras,
        "processing_cameras": processing_cameras,
        "error_cameras": error_cameras,
        "total_events_today": total_events_today,
        "message": message,
    }