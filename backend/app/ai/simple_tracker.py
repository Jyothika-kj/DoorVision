import math
from typing import Any


class SimpleCentroidTracker:
    def __init__(
        self,
        max_distance: int = 80,
        max_missing_frames: int = 20,
    ):
        self.next_track_id = 1
        self.tracks: dict[int, dict[str, Any]] = {}

        self.max_distance = max_distance
        self.max_missing_frames = max_missing_frames

    def _calculate_distance(self, point_a: list[int], point_b: list[int]) -> float:
        return math.sqrt(
            (point_a[0] - point_b[0]) ** 2 +
            (point_a[1] - point_b[1]) ** 2
        )

    def update(self, detections: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """
        Adds track_id to each detection.
        This is a simple centroid tracker.
        Later we can replace it with ByteTrack.
        """

        if len(detections) == 0:
            self._mark_all_missing()
            return []

        updated_detections = []

        used_track_ids = set()

        for detection in detections:
            detection_center = detection["center"]

            best_track_id = None
            best_distance = float("inf")

            for track_id, track_data in self.tracks.items():
                if track_id in used_track_ids:
                    continue

                distance = self._calculate_distance(
                    detection_center,
                    track_data["center"],
                )

                if distance < best_distance and distance <= self.max_distance:
                    best_distance = distance
                    best_track_id = track_id

            if best_track_id is None:
                best_track_id = self.next_track_id
                self.next_track_id += 1

            self.tracks[best_track_id] = {
                "center": detection_center,
                "box": detection["box"],
                "missing_frames": 0,
            }

            used_track_ids.add(best_track_id)

            detection["track_id"] = best_track_id
            updated_detections.append(detection)

        self._mark_unused_tracks_missing(used_track_ids)

        return updated_detections

    def _mark_all_missing(self):
        track_ids_to_delete = []

        for track_id, track_data in self.tracks.items():
            track_data["missing_frames"] += 1

            if track_data["missing_frames"] > self.max_missing_frames:
                track_ids_to_delete.append(track_id)

        for track_id in track_ids_to_delete:
            self.tracks.pop(track_id, None)

    def _mark_unused_tracks_missing(self, used_track_ids: set[int]):
        track_ids_to_delete = []

        for track_id, track_data in self.tracks.items():
            if track_id not in used_track_ids:
                track_data["missing_frames"] += 1

                if track_data["missing_frames"] > self.max_missing_frames:
                    track_ids_to_delete.append(track_id)

        for track_id in track_ids_to_delete:
            self.tracks.pop(track_id, None)