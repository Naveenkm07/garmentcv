from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductMeasurementCreate
from app.services.product_service import ProductService

router = APIRouter()


def _svc(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(db)


@router.post("", response_model=ProductResponse)
def create_product(
    product_in: ProductCreate,
    svc: ProductService = Depends(_svc),
    current_user: User = Depends(get_current_active_user),
):
    return svc.create_product(product_in)


@router.get("", response_model=List[ProductResponse])
def get_products(
    skip: int = 0,
    limit: int = 100,
    svc: ProductService = Depends(_svc),
    current_user: User = Depends(get_current_active_user),
):
    return svc.list_products(skip=skip, limit=limit)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    svc: ProductService = Depends(_svc),
    current_user: User = Depends(get_current_active_user),
):
    return svc.get_product(product_id)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    svc: ProductService = Depends(_svc),
    current_user: User = Depends(get_current_active_user),
):
    return svc.update_product(product_id, product_in)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    svc: ProductService = Depends(_svc),
    current_user: User = Depends(get_current_active_user),
):
    svc.delete_product(product_id)


@router.post("/{product_id}/images", response_model=ProductResponse)
def upload_product_image(
    product_id: int,
    image_type: str = Form(...),
    capture_source: str = Form("WEBCAM"),
    file: UploadFile = File(...),
    svc: ProductService = Depends(_svc),
    current_user: User = Depends(get_current_active_user),
):
    return svc.upload_image(product_id, file, image_type, capture_source)


@router.post("/{product_id}/measure", response_model=ProductResponse)
def add_manual_measurement(
    product_id: int,
    measurement_in: ProductMeasurementCreate,
    svc: ProductService = Depends(_svc),
    current_user: User = Depends(get_current_active_user),
):
    return svc.add_measurement(product_id, measurement_in)
