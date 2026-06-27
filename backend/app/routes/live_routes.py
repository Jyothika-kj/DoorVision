import time

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user_model import User
from app.schemas.live_schema import (
    LiveActionResponse,
    LiveCountResponse,
    LiveStatusResponse,
)
from app.services.camera_service import get_camera_by_id
from app.services.live_camera_service import (
    get_live_count,
    get_live_status,
    get_runtime,
    reset_live_count,
    start_camera_processing,
    stop_camera_processing,
    take_snapshot,
)


router = APIRouter(
    prefix="/live",
    tags=["Live Camera"],
)


@router.post("/start/{camera_id}", response_model=LiveActionResponse)
def start_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = start_camera_processing(db, camera_id)

    if result["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"],
        )

    return result


@router.post("/stop/{camera_id}", response_model=LiveActionResponse)
def stop_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    camera = get_camera_by_id(db, camera_id)

    if camera is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found",
        )

    return stop_camera_processing(db, camera_id)


@router.get("/status/{camera_id}", response_model=LiveStatusResponse)
def live_status(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = get_live_status(db, camera_id)

    if result["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["message"],
        )

    return result


@router.get("/count/{camera_id}", response_model=LiveCountResponse)
def live_count(
    camera_id: int,
    current_user: User = Depends(get_current_user),
):
    return get_live_count(camera_id)


@router.post("/reset/{camera_id}")
def reset_count(
    camera_id: int,
    current_user: User = Depends(require_admin),
):
    return reset_live_count(camera_id)


def generate_mjpeg_stream(camera_id: int):
    while True:
        runtime = get_runtime(camera_id)

        if runtime is None or not runtime.is_running:
            time.sleep(0.2)
            continue

        frame = runtime.get_jpeg_frame()

        if frame is None:
            time.sleep(0.05)
            continue

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
        )

        time.sleep(0.03)


@router.get("/stream/{camera_id}")
def live_stream(
    camera_id: int,
):
    return StreamingResponse(
        generate_mjpeg_stream(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.post("/snapshot/{camera_id}")
def snapshot_camera(
    camera_id: int,
    current_user: User = Depends(require_admin),
):
    result = take_snapshot(camera_id)

    if result["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"],
        )

    return result