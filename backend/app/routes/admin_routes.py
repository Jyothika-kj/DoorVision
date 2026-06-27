from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.user_model import User
from app.schemas.admin_schema import SystemHealthResponse
from app.services.admin_service import get_system_health


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/system-health", response_model=SystemHealthResponse)
def system_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return get_system_health(db)