from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.camera_model import Camera
from app.models.count_event_model import CountEvent
from app.models.daily_report_model import DailyReport


def get_dashboard_summary(db: Session) -> dict:
    today = date.today()

    today_reports = (
        db.query(DailyReport)
        .filter(DailyReport.report_date == today)
        .all()
    )

    total_entry_today = sum(report.total_entry for report in today_reports)
    total_exit_today = sum(report.total_exit for report in today_reports)
    currently_inside = sum(report.currently_inside for report in today_reports)

    peak_occupancy_today = 0
    if today_reports:
        peak_occupancy_today = max(report.peak_occupancy for report in today_reports)

    total_cameras = db.query(Camera).count()

    active_cameras = (
        db.query(Camera)
        .filter(Camera.status.in_(["CONNECTED", "PROCESSING"]))
        .count()
    )

    offline_cameras = (
        db.query(Camera)
        .filter(Camera.status.in_(["OFFLINE", "STOPPED"]))
        .count()
    )

    error_cameras = (
        db.query(Camera)
        .filter(Camera.status == "ERROR")
        .count()
    )

    return {
        "total_entry_today": total_entry_today,
        "total_exit_today": total_exit_today,
        "currently_inside": currently_inside,
        "peak_occupancy_today": peak_occupancy_today,
        "total_cameras": total_cameras,
        "active_cameras": active_cameras,
        "offline_cameras": offline_cameras,
        "error_cameras": error_cameras,
    }


def get_recent_events(db: Session, limit: int = 10) -> list[dict]:
    events = (
        db.query(CountEvent, Camera.camera_name)
        .join(Camera, Camera.id == CountEvent.camera_id)
        .order_by(CountEvent.event_time.desc())
        .limit(limit)
        .all()
    )

    result = []

    for event, camera_name in events:
        result.append(
            {
                "id": event.id,
                "camera_id": event.camera_id,
                "camera_name": camera_name,
                "event_type": event.event_type,
                "track_id": event.track_id,
                "event_time": event.event_time,
            }
        )

    return result