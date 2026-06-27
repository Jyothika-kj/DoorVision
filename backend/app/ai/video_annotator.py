import cv2


def draw_detection_overlays(
    frame,
    tracked_detections: list[dict],
    line_start_x: float = 0.0,
    line_start_y: float = 0.6,
    line_end_x: float = 1.0,
    line_end_y: float = 0.6,
    recent_events: list[dict] | None = None,
):
    height, width = frame.shape[:2]

    x1_line = int(line_start_x * width)
    y1_line = int(line_start_y * height)
    x2_line = int(line_end_x * width)
    y2_line = int(line_end_y * height)

    # Draw custom counting line
    cv2.line(
        frame,
        (x1_line, y1_line),
        (x2_line, y2_line),
        (78, 222, 163),
        2,
    )

    label_x = min(max(x1_line + 10, 10), width - 260)
    label_y = max(y1_line - 10, 25)

    cv2.putText(
        frame,
        "ENTRY / EXIT LINE ACTIVE",
        (label_x, label_y),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (78, 222, 163),
        1,
        cv2.LINE_AA,
    )

    for detection in tracked_detections:
        x1, y1, x2, y2 = detection["box"]
        center_x, center_y = detection["center"]
        track_id = detection.get("track_id", "-")
        confidence = detection.get("confidence", 0.0)
        class_name = detection.get("class_name", "object")

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (190, 198, 224),
            2,
        )

        label = f"ID:{track_id} {class_name} {confidence:.2f}"

        label_size, _ = cv2.getTextSize(
            label,
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            1,
        )

        label_width, label_height = label_size

        cv2.rectangle(
            frame,
            (x1, max(0, y1 - label_height - 8)),
            (x1 + label_width + 8, y1),
            (0, 0, 0),
            -1,
        )

        cv2.putText(
            frame,
            label,
            (x1 + 4, y1 - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (255, 255, 255),
            1,
            cv2.LINE_AA,
        )

        cv2.circle(
            frame,
            (center_x, center_y),
            4,
            (78, 222, 163),
            -1,
        )

    if recent_events:
        y_offset = 30

        for event in recent_events[-3:]:
            event_text = f"{event['event_type']} ID:{event['track_id']}"

            color = (
                (78, 222, 163)
                if event["event_type"] == "ENTRY"
                else (123, 208, 255)
            )

            cv2.putText(
                frame,
                event_text,
                (20, y_offset),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                color,
                2,
                cv2.LINE_AA,
            )

            y_offset += 28

    return frame