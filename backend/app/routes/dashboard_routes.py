from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user_model import User
from app.schemas.dashboard_schema import (
    DashboardSummaryResponse,
    RecentEventResponse,
)
from app.services.dashboard_service import (
    get_dashboard_summary,
    get_recent_events,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_summary(db)


@router.get("/recent-events", response_model=list[RecentEventResponse])
def dashboard_recent_events(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_recent_events(db, limit)