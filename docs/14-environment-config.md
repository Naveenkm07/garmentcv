# 14 - Environment & Configuration

Complete reference for all environment variables, configuration files, and settings used in GarmentCV.

---

## Overview

GarmentCV uses **environment variables** for all configuration, managed through:
- `.env` files (loaded via python-dotenv and Vite)
- Docker Compose environment mapping
- pydantic-settings for type validation in the backend

---

## Backend Configuration

### Settings Class (`app/core/config.py`)

All backend configuration is defined in a pydantic `BaseSettings` class that automatically loads from environment variables.

```python
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    # Project info
    PROJECT_NAME: str = "Garment Measurement API"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str
    
    # JWT Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Storage
    STORAGE_PROVIDER: str = "local"
    STORAGE_PATH: str = "./uploads"
    
    # CV Settings
    HIGH_CONFIDENCE_THRESHOLD: float = 0.90
    MEDIUM_CONFIDENCE_THRESHOLD: float = 0.75
    
    model_config = ConfigDict(env_file="../.env", env_file_encoding="utf-8")

settings = Settings()
```

### Environment Variables

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `DATABASE_URL` | Yes | - | Database connection string | `sqlite:///./test.db`<br>`postgresql://user:pass@db:5432/garmentcv` |
| `SECRET_KEY` | Yes | - | JWT signing key (64+ chars hex) | `26a71d9ab453c5221f0b7924dc657aef18e7a4b381ef65d4f50ca8f7a5119e85` |
| `ALGORITHM` | No | `HS256` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` | Token lifetime in minutes | `1440` (24h) |
| `STORAGE_PROVIDER` | No | `local` | Storage backend (`local`, `s3`, `gcs`) | `local` |
| `STORAGE_PATH` | No | `./uploads` | Base directory for file storage | `./uploads` |
| `HIGH_CONFIDENCE_THRESHOLD` | No | `0.90` | CV confidence threshold for auto-accept | `0.90` |
| `MEDIUM_CONFIDENCE_THRESHOLD` | No | `0.75` | CV confidence threshold for review flag | `0.75` |

### .env Files

#### `.env` (Development)
```env
# Database
DATABASE_URL=sqlite:///./test.db

# JWT Auth
SECRET_KEY=26a71d9ab453c5221f0b7924dc657aef18e7a4b381ef65d4f50ca8f7a5119e85
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Storage
STORAGE_PROVIDER=local
STORAGE_PATH=./uploads

# CV Settings
HIGH_CONFIDENCE_THRESHOLD=0.90
MEDIUM_CONFIDENCE_THRESHOLD=0.75
```

#### `.env.example` (Template)
```env
# Database
DATABASE_URL=sqlite:///./test.db

# JWT Auth
SECRET_KEY=your-secret-key-here-min-64-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Storage
STORAGE_PROVIDER=local
STORAGE_PATH=./uploads

# CV Settings
HIGH_CONFIDENCE_THRESHOLD=0.90
MEDIUM_CONFIDENCE_THRESHOLD=0.75
```

> **Important:** Never commit `.env` to version control. Only `.env.example` should be tracked.

### Docker Compose Environment

In `docker-compose.yml`, environment variables are mapped:

```yaml
services:
  backend:
    env_file:
      - .env  # Loads from project root
    environment:
      # Can override specific values here
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/garmentcv
```

The backend service automatically gets the same `.env` file as the project root.

### Runtime Configuration Access

In backend code, access settings via:
```python
from app.core.config import settings

# Examples
database_url = settings.DATABASE_URL
secret_key = settings.SECRET_KEY
storage_path = settings.STORAGE_PATH
```

---

## Frontend Configuration

Frontend uses Vite environment variables prefixed with `VITE_`.

### `.env` (Frontend)
```env
VITE_API_URL=http://localhost:8000
```

### Available Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | - | Backend API base URL |

### Usage in Frontend Code

```typescript
// Automatically available in all frontend code
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// Example API call
fetch(`${API_URL}/api/products`, {
  headers: { Authorization: `Bearer ${token}` }
})
```

### Docker Compose Frontend Environment

```yaml
services:
  frontend:
    environment:
      - VITE_API_URL=http://backend:8000
```

---

## Configuration Priority

Configuration is loaded in this order (later overrides earlier):

1. **Default values** (in Settings class)
2. **`.env` file** (from `env_file` setting)
3. **Environment variables** (actual process env)
4. **Docker Compose `environment`** (for services)
5. **Explicit function arguments** (when calling constructors)

### Example Override Chain

For `SECRET_KEY`:
1. Default: None (required, no default)
2. `.env`: `SECRET_KEY=abc123...`
3. Process env: `SECRET_KEY=def456...` ← **wins**
4. Docker Compose: `environment: - SECRET_KEY=ghi789...` ← ignored if process env set
5. Constructor: `Settings(SECRET_KEY=jkl012...)` ← would win if used

---

## Production Configuration Guide

### Generate Secure Secrets

```bash
# Generate secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Output: 64-character hex string
```

### Sample Production .env

```env
# Database (managed PostgreSQL)
DATABASE_URL=postgresql://garmentcv:strong_password@db-prod:5432/garmentcv

# JWT Auth (64+ char random string)
SECRET_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Storage (AWS S3 example)
STORAGE_PROVIDER=s3
STORAGE_PATH=garmentcv-uploads
# Additional S3 vars would go here: AWS_ACCESS_KEY_ID, etc.

# CV Settings (tune based on model accuracy)
HIGH_CONFIDENCE_THRESHOLD=0.92
MEDIUM_CONFIDENCE_THRESHOLD=0.80
```

### Docker Compose Production Overrides

Create a `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  backend:
    image: garmentcv/backend:latest
    # Remove volume mounts for security
    # - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://garmentcv:${DB_PASSWORD}@db:5432/garmentcv
      - SECRET_KEY=${PROD_SECRET_KEY}
      - STORAGE_PROVIDER=s3
      # Add AWS env vars here
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
    
  frontend:
    image: garmentcv/frontend:latest
    environment:
      - VITE_API_URL=https://api.garmentcv.example.com
```

Deploy with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Configuration Validation

The pydantic Settings class provides automatic validation:

- Type checking (ensures `ACCESS_TOKEN_EXPIRE_MINUTES` is int)
- Required field enforcement (throws error if `DATABASE_URL` missing)
- Custom validators can be added

### Adding Custom Validation

```python
from pydantic import field_validator

class Settings(BaseSettings):
    # ... existing fields
    
    @field_validator('ACCESS_TOKEN_EXPIRE_MINUTES')
    @classmethod
    def check_token_expiry(cls, v):
        if v < 5:
            raise ValueError('Token expiry must be at least 5 minutes')
        if v > 525600:  # 1 year
            raise ValueError('Token expiry cannot exceed 1 year')
        return v
    
    @field_validator('HIGH_CONFIDENCE_THRESHOLD', 'MEDIUM_CONFIDENCE_THRESHOLD')
    @classmethod
    def check_thresholds(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Threshold must be between 0 and 1')
        return v
```

---

## Configuration in Different Environments

| Environment | DATABASE_URL | SECRET_KEY | STORAGE_PROVIDER | Notes |
|-------------|--------------|------------|------------------|-------|
| Developer Local | `sqlite:///./test.db` | Random dev key | `local` | Uses test.db in backend/ |
| CI/CD | `sqlite:///:memory:` or test postgres | Test key | `local` | Fast, isolated tests |
| Staging | Managed staging DB | Staging key | `local` or `s3-staging` | Mirrors prod config |
| Production | Managed prod DB | Production key | `s3` or `gcs` | Optimized for performance |

---

## Tips and Best Practices

1. **Never commit secrets** - Add `.env` to `.gitignore`
2. **Use different keys per environment** - Dev, staging, prod should all have distinct SECRET_KEY values
3. **Rotate secrets periodically** - Change SECRET_KEY and redeploy (invalidates all existing tokens)
4. **Validate in CI** - Add a step that tries to load Settings to catch missing variables early
5. **Document all variables** - Keep this document and `.env.example` up to date
6. **Use secrets management in production** - AWS Secrets Manager, HashiCorp Vault, etc.
7. **Avoid magic numbers** - Put all tunable values in environment variables
8. **Group related variables** - Use prefixes like `CV_`, `STORAGE_`, `AUTH_` for clarity

---

## Example: Switching to S3 Storage

To switch from local storage to AWS S3:

1. Install dependencies:
   ```bash
   pip install boto3
   ```

2. Update `.env`:
   ```env
   STORAGE_PROVIDER=s3
   STORAGE_PATH=garmentcv-bucket/uploads
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_DEFAULT_REGION=us-east-1
   ```

3. Implement `S3Storage` class in `app/storage/s3_storage.py` implementing the same interface as `LocalStorage`

4. Update `app/storage/__init__.py` to conditionally import the correct provider:
   ```python
   if settings.STORAGE_PROVIDER == "s3":
       from .s3_storage import S3Storage as StorageClass
       storage = StorageClass()
   else:
       from .local_storage import LocalStorage as StorageClass
       storage = StorageClass()
   ```

5. All service layer code continues to work unchanged (depends on abstract `storage` object)