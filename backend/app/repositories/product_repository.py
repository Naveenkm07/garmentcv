"""
Product repository — thin data-access layer over SQLAlchemy.

Route handlers delegate DB queries here instead of embedding them inline,
keeping route handlers focused on HTTP concerns.
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.product import Product, ProductImage, ProductMeasurement, ProductStatus


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- Products ---

    def get_by_id(self, product_id: int) -> Optional[Product]:
        return self.db.query(Product).filter(Product.id == product_id).first()

    def get_by_sku(self, sku: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.sku == sku).first()

    def list(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[ProductStatus] = None,
    ) -> List[Product]:
        q = self.db.query(Product)
        if status:
            q = q.filter(Product.status == status)
        return q.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()

    def count(self, status: Optional[ProductStatus] = None) -> int:
        q = self.db.query(Product)
        if status:
            q = q.filter(Product.status == status)
        return q.count()

    def create(self, **kwargs) -> Product:
        product = Product(**kwargs)
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product, **kwargs) -> Product:
        for key, value in kwargs.items():
            setattr(product, key, value)
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product: Product) -> None:
        self.db.delete(product)
        self.db.commit()

    # --- Images ---

    def add_image(self, product: Product, **kwargs) -> ProductImage:
        image = ProductImage(product_id=product.id, **kwargs)
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image

    # --- Measurements ---

    def add_measurement(self, product: Product, **kwargs) -> ProductMeasurement:
        measurement = ProductMeasurement(product_id=product.id, **kwargs)
        self.db.add(measurement)
        self.db.commit()
        self.db.refresh(measurement)
        return measurement
