# 04 - Project Structure

Complete directory layout of the GarmentCV monorepo.

---

## Root Directory

```
garmentcv/
|
|-- .env                          # Active environment configuration
|-- .env.example                  # Template for environment variables
|-- docker-compose.yml            # Multi-container orchestration
|-- PROJECT_STATUS.md             # Current project status tracker
|-- CHANGELOG.md                  # Version history
|
|-- backend/                      # Python FastAPI service
|-- frontend/                     # React TypeScript SPA
|-- ml/                           # Machine learning / CV pipeline (planned)
|-- database/                     # DB seeds and extra migrations
|-- tests/                        # Test suites
|-- docs/                         # Documentation (this folder)
|-- docker/                       # Extra Docker configs (planned)
|-- scripts/                      # Utility scripts (planned)
|-- sample_data/                  # Sample garment images (planned)
```

---

## Backend (`backend/`)

```
backend/
|-- Dockerfile                    # Container image definition
|-- requirements.txt              # Python dependencies
|-- alembic.ini                   # Alembic migration config
|-- test.db                       # SQLite development database
|-- storage/                      # Uploaded file storage (runtime)
|
|-- alembic/                      # Migration framework
|   |-- env.py                    # Migration environment setup
|   |-- versions/
|       |-- 66f832152e92_initial_migration.py
|
|-- app/                          # Application package
    |-- main.py                   # FastAPI app entry point
    |
    |-- api/                      # Route handlers (HTTP layer)
    |   |-- auth.py               # Login and registration endpoints
    |   |-- products.py           # Product CRUD + image upload
    |   |-- calibration.py        # Calibration endpoints
    |   |-- deps.py               # Shared dependencies (JWT guard)
    |
    |-- core/                     # Framework configuration
    |   |-- config.py             # Settings via pydantic-settings
    |   |-- database.py           # SQLAlchemy engine and sessions
    |   |-- security.py           # Password hashing, JWT creation
    |
    |-- models/                   # SQLAlchemy ORM models
    |   |-- __init__.py           # Model registry (imports all models)
    |   |-- user.py               # User model
    |   |-- product.py            # Product, ProductImage, ProductMeasurement
    |   |-- calibration.py        # Calibration model
    |   |-- audit.py              # AuditLog model
    |   |-- camera.py             # CameraSource model
    |   |-- catalog.py            # ProductCategory, SimilarityGroup
    |
    |-- schemas/                  # Pydantic request/response DTOs
    |   |-- user.py               # UserCreate, UserResponse, Token
    |   |-- product.py            # ProductCreate, ProductResponse, etc.
    |
    |-- services/                 # Business logic layer
    |   |-- __init__.py
    |   |-- product_service.py    # Product business operations
    |   |-- user_service.py       # User management operations
    |
    |-- repositories/             # Data access layer
    |   |-- __init__.py
    |   |-- product_repository.py # Product CRUD queries
    |
    |-- storage/                  # File storage abstraction
    |   |-- __init__.py
    |   |-- local_storage.py      # Local filesystem provider
    |
    |-- auth/                     # (Planned) Advanced auth features
    |-- cv/                       # (Planned) CV processing integration
    |-- utils/                    # (Planned) Utility helpers
    |-- workers/                  # (Planned) Background task workers
```

---

## Frontend (`frontend/`)

```
frontend/
|-- Dockerfile                    # Container image definition
|-- package.json                  # NPM dependencies and scripts
|-- vite.config.ts                # Vite build configuration
|-- index.html                    # HTML entry point
|-- .oxlintrc.json                # Linter configuration
|
|-- src/
    |-- main.tsx                  # React app bootstrap
    |-- App.tsx                   # Router and route definitions
    |-- index.css                 # Global CSS design system
    |
    |-- pages/                    # Page-level components
    |   |-- Login.tsx             # Login / registration page
    |   |-- Dashboard.tsx         # Dashboard with live stats
    |   |-- NewProduct.tsx        # Product creation form
    |   |-- Catalog.tsx           # Product catalog with search
    |   |-- Calibration.tsx       # Camera calibration wizard
    |
    |-- components/               # Shared UI components
    |   |-- Layout.tsx            # App shell with sidebar and auth guard
    |
    |-- features/                 # (Planned) Feature modules
    |-- hooks/                    # (Planned) Custom React hooks
    |-- services/                 # (Planned) API client service
    |-- types/                    # (Planned) TypeScript type definitions
    |-- utils/                    # (Planned) Utility functions
```

---

## ML Pipeline (`ml/`)

```
ml/
|-- calibration/                  # Camera calibration algorithms
|-- inference/                    # Model inference runners
|-- measurement/                  # Pixel-to-mm conversion logic
|-- models/                       # Trained model weights
|-- segmentation/                 # Garment region segmentation
```

> All directories are currently empty placeholders. See [16-roadmap.md](16-roadmap.md) for implementation plans.

---

## Tests (`tests/`)

```
tests/
|-- backend/                      # Backend unit and integration tests
|-- cv/                           # CV pipeline tests
|-- frontend/                     # Frontend component tests
|-- integration/                  # End-to-end tests
|-- performance/                  # Load and performance tests
```

> All directories are currently empty. See [15-testing.md](15-testing.md) for testing strategy.

---

## Database (`database/`)

```
database/
|-- migrations/                   # Additional migration scripts
|-- seed/                         # Seed data for development
```

---

## Key Files at a Glance

| File | Purpose |
|------|---------|
| `backend/app/main.py` | App creation, CORS, static files, router mounting |
| `backend/app/core/config.py` | All configuration via environment variables |
| `backend/app/core/database.py` | Engine creation, session factory, `get_db` |
| `backend/app/core/security.py` | `create_access_token`, `verify_password`, `get_password_hash` |
| `backend/app/api/deps.py` | `get_current_user`, `get_current_active_user` guards |
| `frontend/src/App.tsx` | All client routes |
| `frontend/src/components/Layout.tsx` | Auth check + sidebar navigation |
| `frontend/src/index.css` | Complete glassmorphism design system |
| `.env` | All runtime configuration |
| `docker-compose.yml` | Full-stack container orchestration |
