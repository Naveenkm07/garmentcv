# 02 - System Architecture

## High-Level Architecture

GarmentCV follows a **three-tier monorepo** architecture:

```
+---------------------+
|   Browser (SPA)     |   React 19 + TypeScript + Vite
|   port 5173         |
+----------+----------+
           |
      HTTP REST (JSON)
      Bearer JWT token
           |
+----------v----------+
|   FastAPI Backend    |   Python 3.11 + Uvicorn
|   port 8000         |
+----------+----------+
           |
    SQLAlchemy ORM
    (sync sessions)
           |
+----------v----------+
|   Database           |   SQLite (dev) / PostgreSQL 15 (prod)
|   port 5432 (pg)     |
+----------------------+
```

---

## Design Patterns

### 1. Layered Architecture (Backend)

The backend separates concerns into four distinct layers:

```
API Layer  (app/api/)
    |
    v
Service Layer  (app/services/)
    |
    v
Repository Layer  (app/repositories/)
    |
    v
ORM / Database  (app/models/ + app/core/database.py)
```

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **API** | HTTP request handling, input validation, response serialization | `products.py` routes |
| **Service** | Business logic, status transitions, validation rules | `ProductService.upload_image()` |
| **Repository** | Data access queries, CRUD operations | `ProductRepository.get_by_sku()` |
| **ORM** | Table-to-object mapping, relationships | `Product`, `ProductImage` models |

### 2. Dependency Injection

FastAPI's `Depends()` mechanism wires layers together:

```python
def _svc(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(db)

@router.post("")
def create_product(svc: ProductService = Depends(_svc), ...):
    return svc.create_product(data)
```

### 3. Storage Abstraction

File storage is encapsulated in a `LocalStorage` class behind a consistent interface (`save`, `delete`, `exists`). This enables future swap to S3, GCS, or Azure Blob without changing service code.

### 4. Auth Guard Pattern

Protected routes declare a dependency on `get_current_active_user`, which extracts and validates the JWT token before the route handler executes:

```python
@router.get("")
def get_products(current_user: User = Depends(get_current_active_user)):
    ...
```

---

## Data Flow

### Product Creation Flow

```
Client                    API                   Service              Repository           DB
  |--- POST /api/products -->|                       |                      |                |
  |                          |-- create_product() -->|                      |                |
  |                          |                       |-- get_by_sku() ----->|-- SELECT ----->|
  |                          |                       |<-- None -------------|<-- [] ---------|
  |                          |                       |-- create() --------->|-- INSERT ----->|
  |                          |                       |<-- Product ----------|<-- row --------|
  |<-- 200 ProductResponse --|<-- Product -----------|                      |                |
```

### Image Upload Flow

```
Client                    API                   Service              Storage             DB
  |--- POST .../images ----->|                       |                    |                |
  |   (multipart form)       |-- upload_image() ---->|                    |                |
  |                          |                       |-- save(file) ----->|                |
  |                          |                       |<-- filename -------|                |
  |                          |                       |-- add_image() -----|-- INSERT ----->|
  |                          |                       |-- update(status) --|-- UPDATE ----->|
  |<-- 200 ProductResponse --|<-- Product -----------|                    |                |
```

---

## Frontend Architecture

```
App.tsx (BrowserRouter)
  |
  +-- /login          --> Login.tsx           (public)
  |
  +-- Layout.tsx       (auth guard + sidebar)
       |
       +-- /dashboard  --> Dashboard.tsx      (live API stats)
       +-- /catalog    --> Catalog.tsx         (product table)
       +-- /products/new -> NewProduct.tsx     (create form)
       +-- /calibration -> Calibration.tsx     (calibration flow)
```

- **Auth guard:** `Layout.tsx` checks `localStorage` for a JWT token. If absent, redirects to `/login`.
- **State:** Local component state (`useState`). No global state library.
- **API calls:** Native `fetch` with Bearer token header.

---

## Infrastructure

```
docker-compose.yml
  |
  +-- db        (PostgreSQL 15, port 5432)
  +-- backend   (Python 3.11 + FastAPI, port 8000)
  +-- frontend  (Node 20 + Vite, port 5173)
```

Volumes:
- `postgres_data` -- persistent database storage
- `./uploads` -- mounted into backend for image storage
- `./backend` -- mounted for hot-reload during development

---

## Security Boundaries

| Boundary | Mechanism |
|----------|-----------|
| Client <-> API | JWT Bearer token (HS256, 24h expiry) |
| Password storage | bcrypt hash via passlib |
| CORS | Explicit origin allowlist |
| File uploads | UUID-renamed filenames, no directory traversal |
| SQL injection | SQLAlchemy parameterized queries |
