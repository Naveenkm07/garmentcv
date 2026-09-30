from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.calibration import Calibration
from app.core.config import settings
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class CalibrationResponse(BaseModel):
    id: int
    camera_id: Optional[int] = None
    reference_width_mm: float
    reference_height_mm: float
    marker_configuration: Optional[dict] = None
    camera_resolution: Optional[str] = None
    operator_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=CalibrationResponse)
def create_calibration(
    reference_width_mm: float = Form(...),
    reference_height_mm: float = Form(...),
    reference_type: str = Form("a4"),
    camera_distance_cm: Optional[float] = Form(None),
    camera_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Accept a reference image and calibration parameters.
    Stores the image and creates a calibration record.
    CV-based pixel-to-mm ratio computation can be wired into this endpoint
    once the ml/ pipeline is implemented.
    """
    # Save the calibration image
    uploads_dir = os.path.join(settings.STORAGE_PATH, "calibration")
    os.makedirs(uploads_dir, exist_ok=True)
    file_ext = os.path.splitext(file.filename or "ref.jpg")[1] or ".jpg"
    filename = f"cal_{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(uploads_dir, filename)

    with open(file_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    marker_config = {
        "reference_type": reference_type,
        "image_filename": filename,
        "camera_distance_cm": camera_distance_cm,
    }

    calibration = Calibration(
        camera_id=camera_id,
        reference_width_mm=reference_width_mm,
        reference_height_mm=reference_height_mm,
        marker_configuration=marker_config,
        operator_id=current_user.id,
    )
    db.add(calibration)
    db.commit()
    db.refresh(calibration)
    return calibration


@router.get("", response_model=List[CalibrationResponse])
def list_calibrations(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return db.query(Calibration).order_by(Calibration.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/latest", response_model=CalibrationResponse)
def get_latest_calibration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cal = db.query(Calibration).order_by(Calibration.created_at.desc()).first()
    if not cal:
        raise HTTPException(status_code=404, detail="No calibration found")
    return cal
