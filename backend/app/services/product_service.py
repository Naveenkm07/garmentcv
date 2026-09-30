"""
Product service — business logic layer.

Sits between the API routes and the repository + storage layers.
"""
from typing import List, Optional

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.models.product import Product, ProductStatus
from app.repositories.product_repository import ProductRepository
from app.storage.local_storage import local_storage
from app.schemas.product import ProductCreate, ProductUpdate, ProductMeasurementCreate


class ProductService:
    def __init__(self, db: Session):
        self.repo = ProductRepository(db)

    def create_product(self, data: ProductCreate) -> Product:
        if self.repo.get_by_sku(data.sku):
            raise HTTPException(status_code=400, detail="Product with this SKU already exists")
        return self.repo.create(**data.model_dump())

    def get_product(self, product_id: int) -> Product:
        product = self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    def list_products(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[ProductStatus] = None,
    ) -> List[Product]:
        return self.repo.list(skip=skip, limit=limit, status=status)

    def update_product(self, product_id: int, data: ProductUpdate) -> Product:
        product = self.get_product(product_id)
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        return self.repo.update(product, **updates)

    def delete_product(self, product_id: int) -> None:
        product = self.get_product(product_id)
        # Remove stored images from disk
        for img in product.images:
            local_storage.delete(img.image_path)
        self.repo.delete(product)

    def upload_image(
        self,
        product_id: int,
        file: UploadFile,
        image_type: str,
        capture_source: str = "WEBCAM",
    ) -> Product:
        product = self.get_product(product_id)

        filename = local_storage.save(file.file, file.filename or "upload.jpg")

        self.repo.add_image(
            product,
            image_path=filename,
            image_type=image_type,
            capture_source=capture_source,
        )

        # Advance status on first image upload
        if product.status == ProductStatus.DRAFT:
            self.repo.update(product, status=ProductStatus.CAPTURING)
        else:
            # Refresh after image add
            from sqlalchemy.orm import Session as _S  # avoid circular at module level
            self.repo.db.refresh(product)

        return product

    def add_measurement(
        self,
        product_id: int,
        data: ProductMeasurementCreate,
    ) -> Product:
        product = self.get_product(product_id)
        self.repo.add_measurement(product, **data.model_dump())
        self.repo.update(product, status=ProductStatus.REVIEW_REQUIRED)
        return product
