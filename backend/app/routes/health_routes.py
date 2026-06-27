from fastapi import APIRouter

from app.config import settings
from app.database import test_database_connection


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("/")
def health_check():
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "message": "Sentinel AI backend is running",
    }


@router.get("/db")
def database_health_check():
    is_connected = test_database_connection()

    if is_connected:
        return {
            "status": "ok",
            "database": "connected",
            "message": "PostgreSQL connection successful",
        }

    return {
        "status": "error",
        "database": "not connected",
        "message": "PostgreSQL connection failed",
    }