# 10 - Service & Repository Layers

Documentation of the business logic and data access patterns used in GarmentCV.

---

## Overview

The backend follows a **layered architecture** that separates concerns:

```
API Layer     --> HTTP handling, input validation, response serialization
Service Layer --> Business logic, workflow rules, cross-cutting concerns
Repository    --> Data access, CRUD operations, query building
ORM           --> Table-to-object mapping
```

This separation provides:
- **Testability** -- Services and repositories can be unit-tested without HTTP
- **Reusability** -- Business logic is shared across API endpoints
- **Maintainability** -- Changes to database queries don't affect business rules (and vice versa)

---

## Repository Layer

### ProductRepository

**File:** `backend/app/repositories/product_repository.py`

The repository provides a thin abstraction over SQLAlchemy queries. Each method maps to a single database operation.

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `get_by_id` | `(product_id: int) -> Optional[Product]` | Find product by primary key |
| `get_by_sku` | `(sku: str) -> Optional[Product]` | Find product by unique SKU |
| `list` | `(skip, limit, status?) -> List[Product]` | Paginated list with optional status filter |
| `count` | `(status?) -> int` | Count products, optionally by status |
| `create` | `(**kwargs) -> Product` | Insert new product |
| `update` | `(product, **kwargs) -> Product` | Update product attributes |
| `delete` | `(product) -> None` | Delete a product |
| `add_image` | `(product, **kwargs) -> ProductImage` | Attach an image record |
| `add_measurement` | `(product, **kwargs) -> ProductMeasurement` | Attach a measurement record |

#### Example

```python
repo = ProductRepository(db)

# Find by SKU
product = repo.get_by_sku("TEE-BLK-M-001")

# List with status filter
pending = repo.list(skip=0, limit=50, status=ProductStatus.REVIEW_REQUIRED)

# Count
total = repo.count()
draft_count = repo.count(status=ProductStatus.DRAFT)
```

---

## Service Layer

### ProductService

**File:** `backend/app/services/product_service.py`

The service layer implements business logic on top of the repository and storage layers.

#### Constructor

```python
class ProductService:
    def __init__(self, db: Session):
        self.repo = ProductRepository(db)
```

#### Methods

| Method | Description | Business Rules |
|--------|-------------|----------------|
| `create_product(data)` | Create a new product | Checks SKU uniqueness; raises 400 if duplicate |
| `get_product(id)` | Get product by ID | Raises 404 if not found |
| `list_products(skip, limit, status?)` | List with pagination | Delegates to repository |
| `update_product(id, data)` | Update product fields | Only applies non-None fields |
| `delete_product(id)` | Delete product and files | Removes images from disk before DB delete |
| `upload_image(id, file, type, source)` | Upload and attach image | Saves file via LocalStorage; transitions DRAFT -> CAPTURING |
| `add_measurement(id, data)` | Add measurement | Transitions status to REVIEW_REQUIRED |

#### Status Transition Rules

```python
# On first image upload
if product.status == ProductStatus.DRAFT:
    update(product, status=ProductStatus.CAPTURING)

# On any measurement addition
update(product, status=ProductStatus.REVIEW_REQUIRED)
```

---

### UserService

**File:** `backend/app/services/user_service.py`

Handles user management and authentication logic.

#### Methods

| Method | Description |
|--------|-------------|
| `get_by_email(email)` | Find user by email address |
| `get_by_id(user_id)` | Find user by ID |
| `create_user(data)` | Register new user (checks email uniqueness, hashes password) |
| `authenticate(email, password)` | Verify credentials; returns User or None |
| `deactivate(user_id)` | Set user's `is_active` to False |

---

## Dependency Injection

FastAPI's `Depends()` wires the layers together without global state:

```python
# In the API layer (products.py)

def _svc(db: Session = Depends(get_db)) -> ProductService:
    """Create a ProductService with a DB session for each request."""
    return ProductService(db)

@router.post("")
def create_product(
    product_in: ProductCreate,
    svc: ProductService = Depends(_svc),          # <-- injected
    current_user: User = Depends(get_current_active_user),  # <-- auth guard
):
    return svc.create_product(product_in)
```

**Request lifecycle:**
1. FastAPI resolves `get_db` -> creates a SQLAlchemy session
2. `_svc` wraps the session in a `ProductService`
3. `get_current_active_user` validates the JWT and loads the user
4. The route handler calls service methods
5. After response, the session is closed by `get_db`'s `finally` block

---

## Layer Rules

### API Layer (`app/api/`)
- **May** access: Service layer, Pydantic schemas
- **Must not** access: Repository layer directly, ORM query methods
- **Responsibility:** HTTP concerns only (status codes, response models, form parsing)

### Service Layer (`app/services/`)
- **May** access: Repository layer, Storage layer, other services
- **Must not** access: FastAPI request/response objects, HTTP headers
- **Responsibility:** Business logic, validation rules, workflow transitions
- **Exception:** May raise `HTTPException` for convenience (a pragmatic choice for FastAPI projects)

### Repository Layer (`app/repositories/`)
- **May** access: SQLAlchemy models, Session
- **Must not** access: Pydantic schemas, service logic, storage
- **Responsibility:** CRUD operations and query construction only

### Storage Layer (`app/storage/`)
- **May** access: Filesystem, configuration
- **Must not** access: Database, models, services
- **Responsibility:** File persistence operations only

---

## Adding a New Entity

To add a new entity (e.g., "Order"), follow this pattern:

1. **Model** -- Create `app/models/order.py` with SQLAlchemy table
2. **Schema** -- Create `app/schemas/order.py` with Pydantic DTOs
3. **Repository** -- Create `app/repositories/order_repository.py`
4. **Service** -- Create `app/services/order_service.py`
5. **API** -- Create `app/api/orders.py` with route handlers
6. **Register** -- Import model in `app/models/__init__.py`; include router in `app/main.py`
