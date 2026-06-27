from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "DoorVision AI"
    APP_ENV: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str

    CORS_ORIGINS: str = "http://localhost:5173"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    CAMERA_SECRET_KEY: str

    YOLO_MODEL_PATH: str = "yolov8n.pt"
    YOLO_CONFIDENCE: float = 0.35
    YOLO_TARGET_CLASS: str = "person"

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    class Config:
        env_file = ".env"


settings = Settings()