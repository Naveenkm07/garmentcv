# 09 - File Storage System

Documentation for the file storage abstraction layer, upload flow, and image serving.

---

## Overview

GarmentCV stores uploaded images (product photos and calibration references) on the **local filesystem**. The storage layer is abstracted behind a `LocalStorage` class to enable future migration to cloud storage (S3, GCS, Azure Blob).

---

## Architecture

```
Client
  |-- POST /api/products/{id}/images (multipart)
  |
  v
API Layer (products.py)
  |
  v
Service Layer (ProductService.upload_image)
  |
  v
Storage Layer (LocalStorage.save)
  |
  v
Filesystem: ./uploads/{uuid}.{ext}
  |
  v
Served at: GET /uploads/{filename}  (FastAPI StaticFiles)
```

---

## LocalStorage Class

**File:** `backend/app/storage/local_storage.py`

```python
class LocalStorage:
    def __init__(self, base_path: str | None = None):
        self.base_path = base_path or settings.STORAGE_PATH

    def save(self, file_obj: BinaryIO, original_filename: str, sub: str = "") -> str:
        """Save file and return the stored filename."""
        ...

    def delete(self, filename: str) -> bool:
        """Delete a file by stored filename. Returns True if deleted."""
        ...

    def exists(self, filename: str) -> bool:
        """Check if a file exists."""
        ...

    def full_path(self, filename: str) -> str:
        """Get the absolute filesystem path."""
        ...
```

### Key Design Decisions

1. **UUID filenames** -- Original filenames are discarded. All stored files use `{uuid4}.{ext}` naming, preventing:
   - Path traversal attacks
   - Filename collisions
   - Encoding issues with special characters

2. **Subdirectory support** -- The `sub` parameter allows organizing files into subdirectories:
   ```python
   storage.save(file, "photo.jpg", sub="calibration")
   # Saves to: ./uploads/calibration/{uuid}.jpg
   # Returns: "calibration/{uuid}.jpg"
   ```

3. **Singleton instance** -- A module-level `local_storage` singleton is imported by services:
   ```python
   from app.storage.local_storage import local_storage
   ```

---

## Storage Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_PROVIDER` | `local` | Storage backend type |
| `STORAGE_PATH` | `./uploads` | Base directory for file storage |

The `uploads/` directory is:
- Auto-created at startup (`os.makedirs` in `main.py`)
- Mounted as a Docker volume in `docker-compose.yml`

---

## Image Upload Flow

### Product Image Upload

1. Client sends `POST /api/products/{id}/images` with multipart form data
2. `ProductService.upload_image()` is called
3. `LocalStorage.save()` generates a UUID filename and writes the file
4. A `ProductImage` record is created in the database with the stored filename
5. If the product is in `DRAFT` status, it transitions to `CAPTURING`
6. Updated product is returned to the client

### Calibration Image Upload

1. Client sends `POST /api/calibrations` with multipart form data
2. Image is saved to `./uploads/calibration/` subdirectory
3. Filename is stored in `marker_configuration` JSON field
4. Calibration record is created

---

## Serving Images

Uploaded images are served as static files via FastAPI's `StaticFiles` mount:

```python
# main.py
from fastapi.staticfiles import StaticFiles

app.mount("/uploads", StaticFiles(directory=settings.STORAGE_PATH), name="uploads")
```

**Access URL:** `GET http://localhost:8000/uploads/{filename}`

- No authentication required (images are served directly)
- Directory listing is disabled by default

### Example

If a product image has `image_path = "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"`, the image is accessible at:

```
http://localhost:8000/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
```

---

## File Organization on Disk

```
uploads/
|-- {uuid}.jpg              # Product images
|-- {uuid}.png
|-- calibration/
|   |-- cal_{uuid}.jpg      # Calibration reference images
|   |-- cal_{uuid}.png
```

---

## Docker Volume Mount

```yaml
# docker-compose.yml
services:
  backend:
    volumes:
      - ./uploads:/app/uploads
```

This ensures:
- Files persist across container restarts
- Files are accessible from the host for backup
- Multiple backend instances can share the same storage

---

## Future: Cloud Storage

The `STORAGE_PROVIDER` setting anticipates cloud backends. The planned interface:

```python
class StorageProvider:
    def save(self, file_obj, filename, sub="") -> str: ...
    def delete(self, filename) -> bool: ...
    def exists(self, filename) -> bool: ...
    def get_url(self, filename) -> str: ...

class S3Storage(StorageProvider): ...
class GCSStorage(StorageProvider): ...
```

To switch providers, change `STORAGE_PROVIDER=s3` and add AWS credentials to the environment.

---

## Cleanup

When a product is deleted via `DELETE /api/products/{id}`, the `ProductService.delete_product()` method:

1. Iterates through all product images
2. Calls `local_storage.delete()` for each stored file
3. Deletes the product record (cascade deletes images and measurements from DB)

This prevents orphaned files on disk.
