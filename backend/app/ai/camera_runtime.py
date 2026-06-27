import threading
import time
from typing import Any, Callable

import cv2

from app.ai.detector import YOLODetector
from app.ai.line_counter import LineCrossingCounter
from app.ai.simple_tracker import SimpleCentroidTracker
from app.ai.video_annotator import draw_detection_overlays


class CameraRuntime:
    def __init__(
        self,
        camera_id: int,
        source: str,
        line_start_x: float = 0.0,
        line_start_y: float = 0.6,
        line_end_x: float = 1.0,
        line_end_y: float = 0.6,
        entry_direction: str = "TOP_TO_BOTTOM",
        exit_direction: str = "BOTTOM_TO_TOP",
        confidence_threshold: float = 0.5,
        on_count_event: Callable[[dict[str, Any]], None] | None = None,
    ):
        self.camera_id = camera_id
        self.source = source
        self.confidence_threshold = confidence_threshold

        self.cap = None
        self.thread = None

        self.is_running = False
        self.latest_frame = None
        self.latest_raw_frame = None
        self.last_error = None
        self.last_frame_time = None

        self.frame_width = None
        self.frame_height = None
        self.fps = 0.0

        self.entry_count = 0
        self.exit_count = 0
        self.currently_inside = 0

        self.detection_count = 0
        self.last_events: list[dict[str, Any]] = []

        self.detector = None
        self.tracker = SimpleCentroidTracker()
        self.line_counter = LineCrossingCounter(
            line_start_x=line_start_x,
            line_start_y=line_start_y,
            line_end_x=line_end_x,
            line_end_y=line_end_y,
            entry_direction=entry_direction,
            exit_direction=exit_direction,
        )

        self.line_start_x = line_start_x
        self.line_start_y = line_start_y
        self.line_end_x = line_end_x
        self.line_end_y = line_end_y
        self.on_count_event = on_count_event

        self.lock = threading.Lock()

    def _get_capture_source(self):
        if str(self.source).strip() == "0":
            return 0

        return self.source

    def start(self) -> dict[str, Any]:
        if self.is_running:
            return {
                "status": "ok",
                "message": "Camera is already running",
            }

        try:
            if self.detector is None:
                self.detector = YOLODetector(confidence=self.confidence_threshold)
        except Exception as exc:
            self.last_error = f"Failed to load YOLO model: {str(exc)}"

            return {
                "status": "error",
                "message": self.last_error,
            }

        self.cap = cv2.VideoCapture(self._get_capture_source())

        if not self.cap.isOpened():
            self.cap.release()
            self.cap = None
            self.last_error = "Unable to open camera stream"

            return {
                "status": "error",
                "message": self.last_error,
            }

        self.is_running = True
        self.last_error = None

        self.thread = threading.Thread(
            target=self._read_frames,
            daemon=True,
        )
        self.thread.start()

        return {
            "status": "ok",
            "message": "Camera processing started",
        }

    def _handle_count_events(self, events: list[dict[str, Any]]):
        for event in events:
            event_type = event["event_type"]

            if event_type == "ENTRY":
                self.entry_count += 1

            elif event_type == "EXIT":
                self.exit_count += 1

            self.currently_inside = max(
                0,
                self.entry_count - self.exit_count,
            )

            event_payload = {
                "camera_id": self.camera_id,
                "track_id": event["track_id"],
                "event_type": event_type,
                "direction": event["direction"],
                "center": event["center"],
                "entry_count": self.entry_count,
                "exit_count": self.exit_count,
                "currently_inside": self.currently_inside,
                "timestamp": time.time(),
            }

            self.last_events.append(event_payload)
            self.last_events = self.last_events[-10:]

            if self.on_count_event:
                try:
                    self.on_count_event(event_payload)
                except Exception as exc:
                    self.last_error = f"Failed to save count event: {str(exc)}"

    def _read_frames(self):
        while self.is_running:
            if self.cap is None:
                self.last_error = "Camera capture is not initialized"
                self.is_running = False
                break

            ret, frame = self.cap.read()

            if not ret or frame is None:
                self.last_error = "Failed to read frame from camera"
                time.sleep(0.2)
                continue

            height, width = frame.shape[:2]

            raw_frame = frame.copy()

            try:
                detections = self.detector.detect(frame)
                tracked_detections = self.tracker.update(detections)

                self.detection_count = len(tracked_detections)

                events = self.line_counter.process_tracks(
                    tracked_detections=tracked_detections,
                    frame_width=width,
                    frame_height=height,
                )

                if events:
                    self._handle_count_events(events)

                annotated_frame = draw_detection_overlays(
                    frame=frame,
                    tracked_detections=tracked_detections,
                    line_start_x=self.line_start_x,
                    line_start_y=self.line_start_y,
                    line_end_x=self.line_end_x,
                    line_end_y=self.line_end_y,
                    recent_events=self.last_events,
                )

            except Exception as exc:
                self.last_error = f"AI counting error: {str(exc)}"
                annotated_frame = frame
                self.detection_count = 0

            with self.lock:
                self.latest_raw_frame = raw_frame
                self.latest_frame = annotated_frame
                self.frame_width = width
                self.frame_height = height
                self.last_frame_time = time.time()

                camera_fps = self.cap.get(cv2.CAP_PROP_FPS)
                self.fps = float(camera_fps) if camera_fps else 0.0

            time.sleep(0.01)

    def stop(self) -> dict[str, Any]:
        if not self.is_running:
            return {
                "status": "ok",
                "message": "Camera is already stopped",
            }

        self.is_running = False

        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2)

        if self.cap is not None:
            self.cap.release()
            self.cap = None

        with self.lock:
            self.latest_frame = None
            self.latest_raw_frame = None

        return {
            "status": "ok",
            "message": "Camera processing stopped",
        }

    def get_status(self) -> dict[str, Any]:
        with self.lock:
            has_frame = self.latest_frame is not None

            return {
                "camera_id": self.camera_id,
                "is_running": self.is_running,
                "has_frame": has_frame,
                "frame_width": self.frame_width,
                "frame_height": self.frame_height,
                "fps": self.fps,
                "last_error": self.last_error,
                "last_frame_time": self.last_frame_time,
                "detection_count": self.detection_count,
                "last_events": self.last_events[-5:],
            }

    def get_count(self) -> dict[str, Any]:
        return {
            "camera_id": self.camera_id,
            "entry_count": self.entry_count,
            "exit_count": self.exit_count,
            "currently_inside": self.currently_inside,
            "is_running": self.is_running,
            "detection_count": self.detection_count,
            "last_events": self.last_events[-5:],
        }

    def reset_count(self) -> dict[str, Any]:
        self.entry_count = 0
        self.exit_count = 0
        self.currently_inside = 0
        self.last_events.clear()
        self.line_counter.reset()

        return {
            "status": "ok",
            "message": "Counters reset successfully",
            "data": self.get_count(),
        }

    def save_snapshot(self, snapshot_path: str) -> bool:
        with self.lock:
            if self.latest_frame is None:
                return False

            frame = self.latest_frame.copy()

        return cv2.imwrite(snapshot_path, frame)

    def get_jpeg_frame(self) -> bytes | None:
        with self.lock:
            if self.latest_frame is None:
                return None

            frame = self.latest_frame.copy()

        success, encoded_frame = cv2.imencode(".jpg", frame)

        if not success:
            return None

        return encoded_frame.tobytes()