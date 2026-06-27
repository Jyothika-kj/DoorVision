from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)

    camera_name = Column(String(120), nullable=False)
    location = Column(String(200), nullable=True)
    camera_type = Column(String(50), nullable=False, default="IP_CAMERA")

    rtsp_url = Column(Text, nullable=False)
    username = Column(String(100), nullable=True)
    password_encrypted = Column(Text, nullable=True)

    status = Column(String(30), nullable=False, default="OFFLINE")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    settings = relationship("CameraSettings", back_populates="camera", uselist=False)
    count_events = relationship("CountEvent", back_populates="camera")
    daily_reports = relationship("DailyReport", back_populates="camera")