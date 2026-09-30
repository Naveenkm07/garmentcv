from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class ProductStatus(enum.Enum):
    DRAFT = "DRAFT"
    CAPTURING = "CAPTURING"
    PROCESSING = "PROCESSING"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    VERIFIED = "VERIFIED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    category_id = Column(Integer, index=True) # Could be foreign key later
    brand = Column(String, index=True)
    color = Column(String)
    size_label = Column(String)
    status = Column(SQLEnum(ProductStatus), default=ProductStatus.DRAFT, index=True)
    similarity_group_id = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    measurements = relationship("ProductMeasurement", back_populates="product", cascade="all, delete-orphan")

class ProductImage(Base):
    __tablename__ = "product_images"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    image_path = Column(String, nullable=False)
    image_type = Column(String) # e.g., 'FRONT', 'BACK'
    capture_source = Column(String) # e.g., 'WEBCAM', 'MOBILE'
    width = Column(Integer)
    height = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="images")

class MeasurementType(enum.Enum):
    LENGTH = "LENGTH"
    SHOULDER = "SHOULDER"
    WAIST = "WAIST"
    INSEAM = "INSEAM"
    OUTSEAM = "OUTSEAM"
    HIP = "HIP"
    CHEST = "CHEST"
    SLEEVE = "SLEEVE"

class ProductMeasurement(Base):
    __tablename__ = "product_measurements"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    measurement_type = Column(SQLEnum(MeasurementType), nullable=False)
    automatic_value_mm = Column(Float)
    final_value_mm = Column(Float)
    confidence = Column(Float)
    measurement_method = Column(String) # e.g., 'CV', 'MANUAL'
    review_status = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    product = relationship("Product", back_populates="measurements")
