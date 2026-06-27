from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class CountEvent(Base):
    __tablename__ = "count_events"

    id = Column(Integer, primary_key=True, index=True)

    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)

    track_id = Column(String(100), nullable=True)
    event_type = Column(String(20), nullable=False)

    event_time = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    snapshot_path = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    camera = relationship("Camera", back_populates="count_events")