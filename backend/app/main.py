from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routes import admin_routes, auth_routes, camera_routes, dashboard_routes, health_routes, live_routes, report_routes


app = FastAPI(
    title=settings.APP_NAME,
    description="AI CCTV-based room entry and exit people counting system backend.",
    version="1.0.0",
)

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

(STATIC_DIR / "snapshots").mkdir(parents=True, exist_ok=True)
(STATIC_DIR / "reports").mkdir(parents=True, exist_ok=True)
(STATIC_DIR / "uploads" / "videos").mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Welcome to DoorVision AI Backend",
        "docs": "/docs",
        "health": "/health",
    }


app.include_router(health_routes.router)
app.include_router(auth_routes.router)
app.include_router(camera_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(live_routes.router)
app.include_router(report_routes.router)
app.include_router(admin_routes.router)