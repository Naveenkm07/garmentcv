from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ProductStatus(str, Enum):
    DRAFT = "DRAFT"
    CAPTURING = "CAPTURING"
    PROCESSING = "PROCESSING"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    VERIFIED = "VERIFIED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class MeasurementType(str, Enum):
    LENGTH = "LENGTH"
    SHOULDER = "SHOULDER"
    WAIST = "WAIST"
    INSEAM = "INSEAM"
    OUTSEAM = "OUTSEAM"
    HIP = "HIP"
    CHEST = "CHEST"
    SLEEVE = "SLEEVE"

class ProductImageBase(BaseModel):
    image_type: Optional[str] = None
    capture_source: Optional[str] = None

class ProductImageCreate(ProductImageBase):
    pass

class ProductImageResponse(ProductImageBase):
    id: int
    product_id: int
    image_path: str
    width: Optional[int] = None
    height: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProductMeasurementBase(BaseModel):
    measurement_type: MeasurementType
    automatic_value_mm: Optional[float] = None
    final_value_mm: Optional[float] = None
    confidence: Optional[float] = None
    measurement_method: Optional[str] = None
    review_status: Optional[str] = None

class ProductMeasurementCreate(ProductMeasurementBase):
    pass

class ProductMeasurementResponse(ProductMeasurementBase):
    id: int
    product_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    sku: str
    product_code: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    size_label: Optional[str] = None
    status: ProductStatus = ProductStatus.DRAFT
    similarity_group_id: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    size_label: Optional[str] = None
    status: Optional[ProductStatus] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    images: List[ProductImageResponse] = []
    measurements: List[ProductMeasurementResponse] = []

    class Config:
        from_attributes = True
