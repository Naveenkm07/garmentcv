from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Calibration(Base):
    __tablename__ = "calibrations"
    
    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("camera_sources.id"), index=True, nullable=True)
    reference_width_mm = Column(Float, nullable=False)
    reference_height_mm = Column(Float, nullable=False)
    marker_configuration = Column(JSON) # e.g. ArUco dict type and id
    camera_resolution = Column(String)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    camera = relationship("CameraSource", foreign_keys=[camera_id])
    operator = relationship("User", foreign_keys=[operator_id])
