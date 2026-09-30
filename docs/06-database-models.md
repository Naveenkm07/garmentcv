# 06 - Database & Models

Complete reference for all database tables, ORM models, relationships, and migrations.

---

## Database Configuration

| Environment | Database | Connection |
|-------------|----------|------------|
| Development | SQLite | `sqlite:///./test.db` |
| Production | PostgreSQL 15 | `postgresql://user:pass@db:5432/garmentcv` |

The database URL is configured via the `DATABASE_URL` environment variable in `.env`.

### Engine Creation (`app/core/database.py`)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})  # SQLite
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## Tables

### `users`

**Model:** `app/models/user.py` --> `User`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | Integer | PK, auto-increment | Unique identifier |
| `email` | String | Unique, Not Null, Indexed | Login email |
| `hashed_password` | String | Not Null | bcrypt-hashed password |
| `role` | String | Not Null, Default `"OPERATOR"` | `ADMIN`, `SUPERVISOR`, `OPERATOR`, `VIEWER` |
| `is_active` | Boolean | Default `True` | Account active flag |
| `created_at` | DateTime(tz) | Server default `now()` | Creation timestamp |
| `updated_at` | DateTime(tz) | On update `now()` | Last modification |

---

### `products`

**Model:** `app/models/product.py` --> `Product`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `sku` | String | Unique, Not Null, Indexed | Stock-keeping unit |
| `product_code` | String | Indexed | Additional product code |
| `name` | String | - | Human-readable name |
| `category_id` | Integer | Indexed | Reference to `product_categories` |
| `brand` | String | Indexed | Brand name |
| `color` | String | - | Color description |
| `size_label` | String | - | Size (S, M, L, etc.) |
| `status` | Enum(ProductStatus) | Default `DRAFT`, Indexed | Workflow status |
| `similarity_group_id` | String | Indexed | Groups similar products |
| `created_at` | DateTime(tz) | Server default, Indexed | Creation timestamp |
| `updated_at` | DateTime(tz) | On update | Last modification |

**Relationships:**
- `images` --> `ProductImage[]` (one-to-many, cascade delete)
- `measurements` --> `ProductMeasurement[]` (one-to-many, cascade delete)

**ProductStatus Enum:**
```
DRAFT --> CAPTURING --> PROCESSING --> REVIEW_REQUIRED --> VERIFIED --> COMPLETED
                                                                  \-> REJECTED
```

---

### `product_images`

**Model:** `app/models/product.py` --> `ProductImage`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `product_id` | Integer | FK --> `products.id`, Not Null | Parent product |
| `image_path` | String | Not Null | Stored filename (UUID-based) |
| `image_type` | String | - | `FRONT`, `BACK`, `SIDE`, `DETAIL` |
| `capture_source` | String | - | `WEBCAM`, `MOBILE`, `DSLR` |
| `width` | Integer | - | Image width in pixels |
| `height` | Integer | - | Image height in pixels |
| `created_at` | DateTime(tz) | Server default | Upload timestamp |

---

### `product_measurements`

**Model:** `app/models/product.py` --> `ProductMeasurement`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `product_id` | Integer | FK --> `products.id`, Not Null | Parent product |
| `measurement_type` | Enum(MeasurementType) | Not Null | Dimension being measured |
| `automatic_value_mm` | Float | - | CV-generated value |
| `final_value_mm` | Float | - | Accepted final value |
| `confidence` | Float | - | 0.0 to 1.0 confidence score |
| `measurement_method` | String | - | `MANUAL` or `COMPUTER_VISION` |
| `review_status` | String | - | Review state |
| `created_at` | DateTime(tz) | Server default | Creation timestamp |
| `updated_at` | DateTime(tz) | On update | Last modification |

**MeasurementType Enum:**
```
LENGTH | SHOULDER | WAIST | INSEAM | OUTSEAM | HIP | CHEST | SLEEVE
```

---

### `calibrations`

**Model:** `app/models/calibration.py` --> `Calibration`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `camera_id` | Integer | FK --> `camera_sources.id`, Indexed | Source camera |
| `reference_width_mm` | Float | Not Null | Known reference width |
| `reference_height_mm` | Float | Not Null | Known reference height |
| `marker_configuration` | JSON | - | Reference type, filename, camera distance |
| `camera_resolution` | String | - | e.g. `"1920x1080"` |
| `operator_id` | Integer | FK --> `users.id`, Indexed | User who performed calibration |
| `created_at` | DateTime(tz) | Server default | Calibration timestamp |

**Relationships:**
- `camera` --> `CameraSource` (many-to-one)
- `operator` --> `User` (many-to-one)

---

### `camera_sources`

**Model:** `app/models/camera.py` --> `CameraSource`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `name` | String | Not Null | Camera name/label |
| `type` | String | - | `WEBCAM`, `IP_CAMERA`, `MOBILE` |
| `location` | String | - | Physical location |
| `resolution` | String | - | e.g. `"1920x1080"` |
| `status` | String | Default `"ACTIVE"` | `ACTIVE` or `INACTIVE` |
| `ip_address` | String | - | Network IP (for IP cameras) |
| `created_at` | DateTime(tz) | Server default | Registration timestamp |
| `updated_at` | DateTime(tz) | On update | Last modification |

---

### `product_categories`

**Model:** `app/models/catalog.py` --> `ProductCategory`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `name` | String | Unique, Not Null, Indexed | Category name |
| `description` | String | - | Category description |
| `created_at` | DateTime(tz) | Server default | Creation timestamp |

---

### `similarity_groups`

**Model:** `app/models/catalog.py` --> `SimilarityGroup`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `name` | String | Not Null, Indexed | Group name |
| `description` | String | - | Group description |
| `created_at` | DateTime(tz) | Server default | Creation timestamp |

---

### `audit_logs`

**Model:** `app/models/audit.py` --> `AuditLog`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `user_id` | Integer | FK --> `users.id`, Indexed | Actor |
| `action` | String | Not Null, Indexed | e.g. `product_created`, `measurement_approved` |
| `entity` | String | Not Null | e.g. `product`, `calibration` |
| `entity_id` | Integer | Indexed | ID of affected entity |
| `old_value` | JSON | - | Previous state snapshot |
| `new_value` | JSON | - | New state snapshot |
| `ip_address` | String | - | Client IP address |
| `created_at` | DateTime(tz) | Server default, Indexed | Log timestamp |

**Relationships:**
- `user` --> `User` (many-to-one)

---

## Entity Relationship Diagram

```
users
  |
  |-- 1:N --> audit_logs.user_id
  |-- 1:N --> calibrations.operator_id
  
camera_sources
  |
  |-- 1:N --> calibrations.camera_id

products
  |
  |-- 1:N --> product_images.product_id
  |-- 1:N --> product_measurements.product_id

product_categories  (referenced by products.category_id, no FK enforced yet)

similarity_groups   (referenced by products.similarity_group_id)
```

---

## Migrations

Migrations are managed by **Alembic**. The migration config is at `backend/alembic.ini` and migration scripts are in `backend/alembic/versions/`.

### Running Migrations

```bash
cd backend

# Generate a new migration after model changes
alembic revision --autogenerate -m "description of change"

# Apply all pending migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1

# Show current migration state
alembic current
```

### Initial Migration

`66f832152e92_initial_migration.py` creates all tables listed above.

> **Note:** In development mode, `main.py` calls `Base.metadata.create_all()` at startup, which auto-creates tables without Alembic. For production, always use Alembic migrations.
