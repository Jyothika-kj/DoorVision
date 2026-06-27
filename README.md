# DoorVision AI

DoorVision AI is an AI-powered CCTV/IP camera based people counting system. It detects people from a live camera feed, tracks their movement, and counts entry and exit using virtual line-crossing logic.

## Features

- Admin login with JWT authentication
- Camera add, edit, delete, and connection test
- Webcam, RTSP camera, uploaded video, and internet video support
- Live camera stream
- YOLO-based person detection
- Tracking ID generation
- Entry and exit counting
- Currently inside count
- Dashboard summary
- Daily and date-range reports
- CSV and PDF report export
- Snapshot capture
- Camera settings for line and direction
- Admin system health check

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- React Router

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- OpenCV
- YOLO / Ultralytics
- JWT Authentication
- ReportLab

## Database

The project uses PostgreSQL.

Database name used in development:

```text
doorvision_ai_db