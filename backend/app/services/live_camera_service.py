from typing import Any
import os
from datetime import datetime

from app.ai.camera_runtime import CameraRuntime
from app.database import SessionLocal
from app.models.camera_model import Camera
from app.services.camera_service import (
    get_camera_by_id,
    get_camera_settings,
    update_camera_status,
)
from app.services.count_event_service import save_count_event


active_cameras: dict[int, CameraRuntime] = {}


def get_camera_source(camera: Camera) -> str:
    return camera.rtsp_url


def make_count_event_callback(camera_id: int):
    def callback(event_payload: dict[str, Any]):
        db = SessionLocal()

        try:
            save_count_event(
                db=db,
                camera_id=camera_id,
                track_id=str(event_payload["track_id"]),
                event_type=event_payload["event_type"],
            )
        finally:
            db.close()

    return callback


def start_camera_processing(db, camera_id: int) -> dict[str, Any]:
    camera = get_camera_by_id(db, camera_id)

    if camera is None:
        return {
            "status": "error",
            "message": "Camera not found",
        }

    if camera_id in active_cameras:
        runtime = active_cameras[camera_id]

        if runtime.is_running:
            update_camera_status(db, camera_id, "PROCESSING")

            return {
                "status": "ok",
                "message": "Camera is already processing",
                "camera_id": camera_id,
            }

    settings = get_camera_settings(db, camera_id)

    source = get_camera_source(camera)

    runtime = CameraRuntime(
        camera_id=camera_id,
        source=source,
        line_start_x=settings.line_start_x if settings else 0.0,
        line_start_y=settings.line_start_y if settings else 0.6,
        line_end_x=settings.line_end_x if settings else 1.0,
        line_end_y=settings.line_end_y if settings else 0.6,
        entry_direction=settings.entry_direction if settings else "TOP_TO_BOTTOM",
        exit_direction=settings.exit_direction if settings else "BOTTOM_TO_TOP",
        confidence_threshold=settings.confidence_threshold if settings else 0.5,
        on_count_event=make_count_event_callback(camera_id),
    )

    result = runtime.start()

    if result["status"] == "ok":
        active_cameras[camera_id] = runtime
        update_camera_status(db, camera_id, "PROCESSING")

        return {
            "status": "ok",
            "message": "Camera processing started",
            "camera_id": camera_id,
        }

    update_camera_status(db, camera_id, "ERROR")

    return {
        "status": "error",
        "message": result["message"],
        "camera_id": camera_id,
    }


def stop_camera_processing(db, camera_id: int) -> dict[str, Any]:
    runtime = active_cameras.get(camera_id)

    if runtime is None:
        update_camera_status(db, camera_id, "STOPPED")

        return {
            "status": "ok",
            "message": "Camera is not running",
            "camera_id": camera_id,
        }

    result = runtime.stop()

    active_cameras.pop(camera_id, None)
    update_camera_status(db, camera_id, "STOPPED")

    return {
        "status": result["status"],
        "message": result["message"],
        "camera_id": camera_id,
    }


def get_live_status(db, camera_id: int) -> dict[str, Any]:
    camera = get_camera_by_id(db, camera_id)

    if camera is None:
        return {
            "status": "error",
            "message": "Camera not found",
        }

    runtime = active_cameras.get(camera_id)

    if runtime is None:
        return {
            "status": "ok",
            "camera_id": camera_id,
            "camera_status": camera.status,
            "is_running": False,
            "has_frame": False,
            "frame_width": None,
            "frame_height": None,
            "fps": 0.0,
            "last_error": None,
            "last_frame_time": None,
            "detection_count": 0,
            "last_events": [],
        }

    runtime_status = runtime.get_status()

    return {
        "status": "ok",
        "camera_id": camera_id,
        "camera_status": camera.status,
        **runtime_status,
    }


def get_live_count(camera_id: int) -> dict[str, Any]:
    runtime = active_cameras.get(camera_id)

    if runtime is None:
        return {
            "camera_id": camera_id,
            "entry_count": 0,
            "exit_count": 0,
            "currently_inside": 0,
            "is_running": False,
            "detection_count": 0,
            "last_events": [],
        }

    return runtime.get_count()


def reset_live_count(camera_id: int) -> dict[str, Any]:
    runtime = active_cameras.get(camera_id)

    if runtime is None:
        return {
            "status": "ok",
            "message": "Camera is not running. Counter already reset.",
            "data": {
                "camera_id": camera_id,
                "entry_count": 0,
                "exit_count": 0,
                "currently_inside": 0,
                "is_running": False,
                "detection_count": 0,
                "last_events": [],
            },
        }

    return runtime.reset_count()


def get_runtime(camera_id: int) -> CameraRuntime | None:
    return active_cameras.get(camera_id)


def take_snapshot(camera_id: int) -> dict:
    runtime = active_cameras.get(camera_id)

    if runtime is None or not runtime.is_running:
        return {
            "status": "error",
            "message": "Camera is not running. Start the camera before taking snapshot.",
            "snapshot_path": None,
        }

    snapshots_dir = os.path.join("app", "static", "snapshots")
    os.makedirs(snapshots_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"camera_{camera_id}_{timestamp}.jpg"
    snapshot_path = os.path.join(snapshots_dir, filename)

    saved = runtime.save_snapshot(snapshot_path)

    if not saved:
        return {
            "status": "error",
            "message": "Unable to save snapshot. No frame available.",
            "snapshot_path": None,
        }

    return {
        "status": "ok",
        "message": "Snapshot saved successfully.",
        "snapshot_path": snapshot_path.replace("\\", "/"),
    }