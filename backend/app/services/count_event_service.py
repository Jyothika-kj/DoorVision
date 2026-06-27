from datetime import date

from sqlalchemy.orm import Session

from app.models.count_event_model import CountEvent
from app.models.daily_report_model import DailyReport


def save_count_event(
    db: Session,
    camera_id: int,
    track_id: str,
    event_type: str,
    snapshot_path: str | None = None,
) -> CountEvent:
    event = CountEvent(
        camera_id=camera_id,
        track_id=str(track_id),
        event_type=event_type.upper(),
        snapshot_path=snapshot_path,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    update_daily_report_after_event(
        db=db,
        camera_id=camera_id,
        event_type=event_type.upper(),
    )

    return event


def get_or_create_daily_report(db: Session, camera_id: int) -> DailyReport:
    today = date.today()

    report = (
        db.query(DailyReport)
        .filter(
            DailyReport.camera_id == camera_id,
            DailyReport.report_date == today,
        )
        .first()
    )

    if report:
        return report

    report = DailyReport(
        camera_id=camera_id,
        report_date=today,
        total_entry=0,
        total_exit=0,
        currently_inside=0,
        peak_occupancy=0,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


def update_daily_report_after_event(
    db: Session,
    camera_id: int,
    event_type: str,
) -> DailyReport:
    report = get_or_create_daily_report(db, camera_id)

    if event_type == "ENTRY":
        report.total_entry += 1

    elif event_type == "EXIT":
        report.total_exit += 1

    report.currently_inside = max(
        0,
        report.total_entry - report.total_exit,
    )

    if report.currently_inside > report.peak_occupancy:
        report.peak_occupancy = report.currently_inside

    db.commit()
    db.refresh(report)

    return report


def get_today_report(db: Session, camera_id: int) -> DailyReport:
    return get_or_create_daily_report(db, camera_id)