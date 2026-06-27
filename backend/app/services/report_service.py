from datetime import date, datetime, time

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.models.camera_model import Camera
from app.models.count_event_model import CountEvent
from app.models.daily_report_model import DailyReport


def get_daily_report(
    db: Session,
    report_date: date,
    camera_id: int | None = None,
) -> list[dict]:
    query = (
        db.query(DailyReport, Camera.camera_name)
        .join(Camera, Camera.id == DailyReport.camera_id)
        .filter(DailyReport.report_date == report_date)
    )

    if camera_id:
        query = query.filter(DailyReport.camera_id == camera_id)

    reports = query.order_by(DailyReport.camera_id.asc()).all()

    result = []

    for report, camera_name in reports:
        result.append(
            {
                "id": report.id,
                "camera_id": report.camera_id,
                "camera_name": camera_name,
                "report_date": report.report_date,
                "total_entry": report.total_entry,
                "total_exit": report.total_exit,
                "currently_inside": report.currently_inside,
                "peak_occupancy": report.peak_occupancy,
                "created_at": report.created_at,
                "updated_at": report.updated_at,
            }
        )

    return result


def get_reports_by_date_range(
    db: Session,
    start_date: date,
    end_date: date,
    camera_id: int | None = None,
) -> list[dict]:
    query = (
        db.query(DailyReport, Camera.camera_name)
        .join(Camera, Camera.id == DailyReport.camera_id)
        .filter(DailyReport.report_date >= start_date)
        .filter(DailyReport.report_date <= end_date)
    )

    if camera_id:
        query = query.filter(DailyReport.camera_id == camera_id)

    reports = (
        query
        .order_by(DailyReport.report_date.desc(), DailyReport.camera_id.asc())
        .all()
    )

    result = []

    for report, camera_name in reports:
        result.append(
            {
                "id": report.id,
                "camera_id": report.camera_id,
                "camera_name": camera_name,
                "report_date": report.report_date,
                "total_entry": report.total_entry,
                "total_exit": report.total_exit,
                "currently_inside": report.currently_inside,
                "peak_occupancy": report.peak_occupancy,
                "created_at": report.created_at,
                "updated_at": report.updated_at,
            }
        )

    return result


def get_hourly_report(
    db: Session,
    report_date: date,
    camera_id: int | None = None,
) -> dict:
    start_datetime = datetime.combine(report_date, time.min)
    end_datetime = datetime.combine(report_date, time.max)

    query = (
        db.query(
            extract("hour", CountEvent.event_time).label("hour"),
            CountEvent.event_type,
            func.count(CountEvent.id).label("count"),
        )
        .filter(CountEvent.event_time >= start_datetime)
        .filter(CountEvent.event_time <= end_datetime)
    )

    if camera_id:
        query = query.filter(CountEvent.camera_id == camera_id)

    rows = (
        query
        .group_by("hour", CountEvent.event_type)
        .order_by("hour")
        .all()
    )

    hourly_map = {
        hour: {
            "hour": hour,
            "entry_count": 0,
            "exit_count": 0,
        }
        for hour in range(24)
    }

    for row in rows:
        hour = int(row.hour)

        if row.event_type == "ENTRY":
            hourly_map[hour]["entry_count"] = row.count

        elif row.event_type == "EXIT":
            hourly_map[hour]["exit_count"] = row.count

    return {
        "camera_id": camera_id,
        "report_date": report_date,
        "hourly_data": list(hourly_map.values()),
    }


def get_reports_by_camera(
    db: Session,
    camera_id: int,
) -> list[dict]:
    reports = (
        db.query(DailyReport, Camera.camera_name)
        .join(Camera, Camera.id == DailyReport.camera_id)
        .filter(DailyReport.camera_id == camera_id)
        .order_by(DailyReport.report_date.desc())
        .all()
    )

    result = []

    for report, camera_name in reports:
        result.append(
            {
                "id": report.id,
                "camera_id": report.camera_id,
                "camera_name": camera_name,
                "report_date": report.report_date,
                "total_entry": report.total_entry,
                "total_exit": report.total_exit,
                "currently_inside": report.currently_inside,
                "peak_occupancy": report.peak_occupancy,
                "created_at": report.created_at,
                "updated_at": report.updated_at,
            }
        )

    return result