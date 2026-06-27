from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user_model import User
from app.schemas.camera_schema import (
    CameraCreate,
    CameraResponse,
    CameraTestRequest,
    CameraTestResponse,
    CameraUpdate,
)
from app.schemas.camera_settings_schema import (
    CameraSettingsResponse,
    CameraSettingsUpdate,
)
from app.services.camera_service import (
    create_camera,
    delete_camera,
    get_all_cameras,
    get_camera_by_id,
    get_camera_settings,
    test_camera_connection,
    update_camera,
    update_camera_settings,
    update_camera_status,
)


router = APIRouter(
    prefix="/cameras",
    tags=["Cameras"],
)


@router.post("/", response_model=CameraResponse)
def add_camera(
    camera_data: CameraCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return create_camera(db, camera_data)


@router.get("/", response_model=list[CameraResponse])
def list_cameras(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_cameras(db)


@router.get("/{camera_id}", response_model=CameraResponse)
def get_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    camera = get_camera_by_id(db, camera_id)

    if camera is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found",
        )

    return camera


@router.put("/{camera_id}", response_model=CameraResponse)
def edit_camera(
    camera_id: int,
    camera_data: CameraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    camera = update_camera(db, camera_id, camera_data)

    if camera is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found",
        )

    return camera


@router.delete("/{camera_id}")
def remove_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    deleted = delete_camera(db, camera_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found",
        )

    return {
        "status": "ok",
        "message": "Camera deleted successfully",
    }


@router.post("/test-connection", response_model=CameraTestResponse)
def test_connection(
    test_data: CameraTestRequest,
    current_user: User = Depends(get_current_user),
):
    return test_camera_connection(test_data.rtsp_url)


@router.post("/{camera_id}/test-connection", response_model=CameraTestResponse)
def test_saved_camera_connection(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    camera = get_camera_by_id(db, camera_id)

    if camera is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found",
        )

    result = test_camera_connection(camera.rtsp_url)

    if result["connected"]:
        update_camera_status(db, camera_id, "CONNECTED")
    else:
        update_camera_status(db, camera_id, "ERROR")

    return result


@router.get("/{camera_id}/settings", response_model=CameraSettingsResponse)
def get_settings(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    camera = get_camera_by_id(db, camera_id)

    if camera is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found",
        )

    settings = get_camera_settings(db, camera_id)

    if settings is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera settings not found",
        )

    return settings


@router.put("/{camera_id}/settings", response_model=CameraSettingsResponse)
def update_settings(
    camera_id: int,
    settings_data: CameraSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    settings = update_camera_settings(db, camera_id, settings_data)

    if settings is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found",
        )

    return settings