from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class CameraSource(Base):
    __tablename__ = "camera_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String)          # e.g. 'WEBCAM', 'IP_CAMERA', 'MOBILE'
    location = Column(String)
    resolution = Column(String)    # e.g. '1920x1080'
    status = Column(String, default="ACTIVE")   # ACTIVE / INACTIVE
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
