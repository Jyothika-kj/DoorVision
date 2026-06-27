from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class CameraSettings(Base):
    __tablename__ = "camera_settings"

    id = Column(Integer, primary_key=True, index=True)

    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)

    line_start_x = Column(Float, nullable=False, default=0.0)
    line_start_y = Column(Float, nullable=False, default=0.6)
    line_end_x = Column(Float, nullable=False, default=1.0)
    line_end_y = Column(Float, nullable=False, default=0.6)

    entry_direction = Column(String(50), nullable=False, default="TOP_TO_BOTTOM")
    exit_direction = Column(String(50), nullable=False, default="BOTTOM_TO_TOP")

    confidence_threshold = Column(Float, nullable=False, default=0.50)
    min_track_duration = Column(Float, nullable=False, default=1.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    camera = relationship("Camera", back_populates="settings")