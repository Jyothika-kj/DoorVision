from typing import Any


class LineCrossingCounter:
    def __init__(
        self,
        line_start_x: float = 0.0,
        line_start_y: float = 0.6,
        line_end_x: float = 1.0,
        line_end_y: float = 0.6,
        entry_direction: str = "TOP_TO_BOTTOM",
        exit_direction: str = "BOTTOM_TO_TOP",
    ):
        self.line_start_x = line_start_x
        self.line_start_y = line_start_y
        self.line_end_x = line_end_x
        self.line_end_y = line_end_y

        self.entry_direction = entry_direction.upper()
        self.exit_direction = exit_direction.upper()

        self.track_history: dict[int, dict[str, Any]] = {}
        self.counted_tracks: set[int] = set()

    def reset(self):
        self.track_history.clear()
        self.counted_tracks.clear()

    def _get_line_pixels(self, frame_width: int, frame_height: int) -> dict[str, int]:
        return {
            "x1": int(self.line_start_x * frame_width),
            "y1": int(self.line_start_y * frame_height),
            "x2": int(self.line_end_x * frame_width),
            "y2": int(self.line_end_y * frame_height),
        }

    def _is_horizontal_line(self, line_pixels: dict[str, int]) -> bool:
        return abs(line_pixels["y1"] - line_pixels["y2"]) <= abs(
            line_pixels["x1"] - line_pixels["x2"]
        )

    def _detect_direction(
        self,
        previous_center: list[int],
        current_center: list[int],
        line_pixels: dict[str, int],
    ) -> str | None:
        previous_x, previous_y = previous_center
        current_x, current_y = current_center

        is_horizontal = self._is_horizontal_line(line_pixels)

        if is_horizontal:
            line_y = int((line_pixels["y1"] + line_pixels["y2"]) / 2)

            if previous_y < line_y <= current_y:
                return "TOP_TO_BOTTOM"

            if previous_y > line_y >= current_y:
                return "BOTTOM_TO_TOP"

        else:
            line_x = int((line_pixels["x1"] + line_pixels["x2"]) / 2)

            if previous_x < line_x <= current_x:
                return "LEFT_TO_RIGHT"

            if previous_x > line_x >= current_x:
                return "RIGHT_TO_LEFT"

        return None

    def process_tracks(
        self,
        tracked_detections: list[dict[str, Any]],
        frame_width: int,
        frame_height: int,
    ) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        line_pixels = self._get_line_pixels(frame_width, frame_height)

        for detection in tracked_detections:
            track_id = detection.get("track_id")
            current_center = detection.get("center")

            if track_id is None or current_center is None:
                continue

            previous_data = self.track_history.get(track_id)

            self.track_history[track_id] = {
                "center": current_center,
                "box": detection.get("box"),
            }

            if previous_data is None:
                continue

            if track_id in self.counted_tracks:
                continue

            previous_center = previous_data["center"]

            crossed_direction = self._detect_direction(
                previous_center=previous_center,
                current_center=current_center,
                line_pixels=line_pixels,
            )

            if crossed_direction is None:
                continue

            event_type = None

            if crossed_direction == self.entry_direction:
                event_type = "ENTRY"

            elif crossed_direction == self.exit_direction:
                event_type = "EXIT"

            if event_type is None:
                continue

            self.counted_tracks.add(track_id)

            events.append(
                {
                    "track_id": track_id,
                    "event_type": event_type,
                    "direction": crossed_direction,
                    "center": current_center,
                }
            )

        return events