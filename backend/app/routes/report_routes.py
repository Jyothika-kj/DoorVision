from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from fastapi.responses import FileResponse

from app.utils.file_export import create_report_pdf
from app.services.camera_service import get_camera_by_id

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user_model import User
from app.schemas.report_schema import (
    DailyReportResponse,
    HourlyReportResponse,
)
from app.services.report_service import (
    get_daily_report,
    get_hourly_report,
    get_reports_by_camera,
    get_reports_by_date_range,
)


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("/daily", response_model=list[DailyReportResponse])
def daily_report(
    report_date: date = Query(default_factory=date.today),
    camera_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_daily_report(
        db=db,
        report_date=report_date,
        camera_id=camera_id,
    )


@router.get("/date-range", response_model=list[DailyReportResponse])
def date_range_report(
    start_date: date,
    end_date: date,
    camera_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_reports_by_date_range(
        db=db,
        start_date=start_date,
        end_date=end_date,
        camera_id=camera_id,
    )


@router.get("/hourly", response_model=HourlyReportResponse)
def hourly_report(
    report_date: date = Query(default_factory=date.today),
    camera_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_hourly_report(
        db=db,
        report_date=report_date,
        camera_id=camera_id,
    )


@router.get("/camera/{camera_id}", response_model=list[DailyReportResponse])
def camera_reports(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_reports_by_camera(
        db=db,
        camera_id=camera_id,
    )

@router.get("/export/pdf")
def export_pdf_report(
    start_date: date,
    end_date: date,
    camera_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reports = get_reports_by_date_range(
        db=db,
        start_date=start_date,
        end_date=end_date,
        camera_id=camera_id,
    )

    camera_name = None

    if camera_id:
        camera = get_camera_by_id(db, camera_id)
        if camera:
            camera_name = camera.camera_name

    file_path = create_report_pdf(
        report_rows=reports,
        start_date=start_date,
        end_date=end_date,
        camera_name=camera_name,
    )

    return FileResponse(
        path=file_path,
        filename=file_path.split("/")[-1],
        media_type="application/pdf",
    )