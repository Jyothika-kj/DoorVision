from typing import Any

from ultralytics import YOLO

from app.config import settings


class YOLODetector:
    def __init__(self, confidence: float | None = None):
        self.model_path = settings.YOLO_MODEL_PATH
        self.confidence = confidence if confidence is not None else settings.YOLO_CONFIDENCE
        self.target_class = settings.YOLO_TARGET_CLASS.lower()

        self.model = YOLO(self.model_path)
        self.class_names = self.model.names

    def update_confidence(self, confidence: float):
        self.confidence = confidence

    def detect(self, frame) -> list[dict[str, Any]]:
        """
        Returns detections in this format:
        [
            {
                "class_name": "person",
                "confidence": 0.87,
                "box": [x1, y1, x2, y2],
                "center": [cx, cy]
            }
        ]
        """

        results = self.model.predict(
            source=frame,
            conf=self.confidence,
            verbose=False,
        )

        detections: list[dict[str, Any]] = []

        if not results:
            return detections

        result = results[0]

        if result.boxes is None:
            return detections

        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = self.class_names[class_id].lower()
            confidence = float(box.conf[0])

            if self.target_class != "all" and class_name != self.target_class:
                continue

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            x1 = int(x1)
            y1 = int(y1)
            x2 = int(x2)
            y2 = int(y2)

            center_x = int((x1 + x2) / 2)
            center_y = int((y1 + y2) / 2)

            detections.append(
                {
                    "class_name": class_name,
                    "confidence": confidence,
                    "box": [x1, y1, x2, y2],
                    "center": [center_x, center_y],
                }
            )

        return detections