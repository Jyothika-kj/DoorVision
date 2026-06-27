from typing import Any

import cv2
from sqlalchemy.orm import Session

from app.models.camera_model import Camera
from app.models.camera_settings_model import CameraSettings
from app.schemas.camera_schema import CameraCreate, CameraUpdate
from app.schemas.camera_settings_schema import CameraSettingsCreate, CameraSettingsUpdate
from app.utils.password_crypto import encrypt_text
from app.models.count_event_model import CountEvent
from app.models.daily_report_model import DailyReport


def get_all_cameras(db: Session) -> list[Camera]:
    return db.query(Camera).order_by(Camera.id.desc()).all()


def get_camera_by_id(db: Session, camera_id: int) -> Camera | None:
    return db.query(Camera).filter(Camera.id == camera_id).first()


def create_camera(db: Session, camera_data: CameraCreate) -> Camera:
    new_camera = Camera(
        camera_name=camera_data.camera_name.strip(),
        location=camera_data.location.strip() if camera_data.location else None,
        camera_type=camera_data.camera_type,
        rtsp_url=camera_data.rtsp_url.strip(),
        username=camera_data.username.strip() if camera_data.username else None,
        password_encrypted=encrypt_text(camera_data.password),
        status="OFFLINE",
    )

    db.add(new_camera)
    db.commit()
    db.refresh(new_camera)

    default_settings = CameraSettings(
        camera_id=new_camera.id,
        line_start_x=0.0,
        line_start_y=0.6,
        line_end_x=1.0,
        line_end_y=0.6,
        entry_direction="TOP_TO_BOTTOM",
        exit_direction="BOTTOM_TO_TOP",
        confidence_threshold=0.50,
        min_track_duration=1.0,
    )

    db.add(default_settings)
    db.commit()

    return new_camera


def update_camera(db: Session, camera_id: int, camera_data: CameraUpdate) -> Camera | None:
    camera = get_camera_by_id(db, camera_id)

    if camera is None:
        return None

    update_data = camera_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "password":
            camera.password_encrypted = encrypt_text(value)
        elif value is not None:
            setattr(camera, field, value)

    db.commit()
    db.refresh(camera)

    return camera


# def delete_camera(db: Session, camera_id: int) -> bool:
#     camera = get_camera_by_id(db, camera_id)

#     if camera is None:
#         return False

#     db.delete(camera)
#     db.commit()

#     return True

def delete_camera(db: Session, camera_id: int) -> bool:
    camera = get_camera_by_id(db, camera_id)

    if camera is None:
        return False

    # Delete child records first
    db.query(CameraSettings).filter(
        CameraSettings.camera_id == camera_id
    ).delete(synchronize_session=False)

    db.query(CountEvent).filter(
        CountEvent.camera_id == camera_id
    ).delete(synchronize_session=False)

    db.query(DailyReport).filter(
        DailyReport.camera_id == camera_id
    ).delete(synchronize_session=False)

    # Then delete camera
    db.delete(camera)
    db.commit()

    return True


def update_camera_status(db: Session, camera_id: int, status: str) -> Camera | None:
    camera = get_camera_by_id(db, camera_id)

    if camera is None:
        return None

    camera.status = status.upper()
    db.commit()
    db.refresh(camera)

    return camera


def test_camera_connection(camera_url: str) -> dict[str, Any]:
    """
    Tests whether OpenCV can read at least one frame from camera.
    For webcam testing, use camera_url = "0".
    For CCTV/IP camera, use RTSP URL.
    """

    source: str | int = camera_url

    if camera_url == "0":
        source = 0

    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        cap.release()
        return {
            "status": "error",
            "connected": False,
            "message": "Unable to open camera stream. Check RTSP URL, username, password, network, or camera power.",
            "frame_width": None,
            "frame_height": None,
            "fps": None,
        }

    ret, frame = cap.read()

    if not ret or frame is None:
        cap.release()
        return {
            "status": "error",
            "connected": False,
            "message": "Camera opened but no frame received.",
            "frame_width": None,
            "frame_height": None,
            "fps": None,
        }

    frame_height, frame_width = frame.shape[:2]
    fps = cap.get(cv2.CAP_PROP_FPS)

    cap.release()

    return {
        "status": "ok",
        "connected": True,
        "message": "Camera connection successful. Frame received.",
        "frame_width": int(frame_width),
        "frame_height": int(frame_height),
        "fps": float(fps) if fps else 0.0,
    }


def get_camera_settings(db: Session, camera_id: int) -> CameraSettings | None:
    return db.query(CameraSettings).filter(CameraSettings.camera_id == camera_id).first()


def create_camera_settings(
    db: Session,
    settings_data: CameraSettingsCreate,
) -> CameraSettings | None:
    camera = get_camera_by_id(db, settings_data.camera_id)

    if camera is None:
        return None

    existing_settings = get_camera_settings(db, settings_data.camera_id)

    if existing_settings:
        return existing_settings

    new_settings = CameraSettings(**settings_data.model_dump())

    db.add(new_settings)
    db.commit()
    db.refresh(new_settings)

    return new_settings


def update_camera_settings(
    db: Session,
    camera_id: int,
    settings_data: CameraSettingsUpdate,
) -> CameraSettings | None:
    settings = get_camera_settings(db, camera_id)

    if settings is None:
        camera = get_camera_by_id(db, camera_id)

        if camera is None:
            return None

        settings = CameraSettings(camera_id=camera_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    update_data = settings_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            setattr(settings, field, value)

    db.commit()
    db.refresh(settings)

    return settings


def mask_rtsp_url(rtsp_url: str) -> str:
    if "@" not in rtsp_url or "://" not in rtsp_url:
        return rtsp_url

    try:
        protocol, rest = rtsp_url.split("://", 1)
        credentials, host_part = rest.split("@", 1)

        if ":" in credentials:
            username, _ = credentials.split(":", 1)
            return f"{protocol}://{username}:******@{host_part}"

        return rtsp_url
    except ValueError:
        return rtsp_url