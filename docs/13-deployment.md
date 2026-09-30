# 13 - Deployment Guide

Documentation for deploying GarmentCV using Docker Compose, manual setup, and production considerations.

---

## Overview

GarmentCV is designed to be deployed via **Docker Compose** for simplicity, but can also be run manually for development or custom deployments.

---

## Docker Compose Deployment (Recommended)

The easiest way to run GarmentCV is with the provided `docker-compose.yml` file.

### Prerequisites

- Docker Engine >= 20.10
- Docker Compose plugin (v2) or standalone docker-compose

### Starting the Stack

```bash
# From the project root
docker-compose up --build
```

This will start three services:
1. `db` - PostgreSQL 15 database
2. `backend` - FastAPI application (port 8000)
3. `frontend` - React development server (port 5173)

### Accessing the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/api/health

### Stopping the Stack

```bash
docker-compose down
```

### Persistent Data

Docker Compose creates two named volumes:
- `postgres_data` - PostgreSQL database files
- `uploads` - Uploaded product and calibration images

To completely reset the database and delete all uploaded files:
```bash
docker-compose down -v
```

### Production Considerations

For production deployments, consider these modifications to `docker-compose.yml`:

1. **Change the backend command** from development to production:
   ```yaml
   command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

2. **Remove volume mounts for source code** to prevent accidental overwrites:
   ```yaml
   # Remove these lines:
   # - ./backend:/app
   # - ./frontend:/app
   ```

3. **Build production frontend** instead of using dev server:
   - Replace `frontend/Dockerfile` with a multi-stage build
   - Serve built files with nginx or similar

4. **Use environment-specific .env files** (see 14-environment-config.md)

5. **Add a reverse proxy** (nginx, traefik) for SSL termination and domain routing

---

## Manual Deployment

### Backend (Python/FastAPI)

```bash
# 1. Clone repository
git clone <repository-url>
cd garmentcv/backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
# Copy .env.example to .env and edit
cp .env.example .env
# Edit .env with your settings

# 5. Run database migrations
alembic upgrade head

# 6. Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend (React/Vite)

```bash
# 1. Navigate to frontend directory
cd ../frontend

# 2. Install dependencies
npm install

# 3. Set environment variables
# Create .env file with:
# VITE_API_URL=http://localhost:8000

# 4. Start development server
npm run dev
```

### Production Build (Frontend)

```bash
# Build for production
npm run build

# The output is in the dist/ directory
# Serve with any static file host (nginx, Apache, etc.)
```

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name garmentcv.example.com;

    root /path/to/garmentcv/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Database Migrations

Always use Alembic for schema changes in production.

```bash
# Generate migration after model changes
alembic revision --autogenerate -m "Add user preferences table"

# Edit the generated migration if needed (in alembic/versions/)

# Apply migration
alembic upgrade head

# Check current revision
alembic current

# Rollback if needed
alembic downgrade -1
```

> **Warning:** Never modify migration files after they've been applied to production databases.

---

## Environment Variables

All configuration is managed through environment variables. See [14-environment-config.md](14-environment-config.md) for the complete reference.

### Backend Variables (in .env)

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./test.db` or `postgresql://user:pass@host:5432/db` | Database connection |
| `SECRET_KEY` | `64-char-hex-string` | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token lifetime |
| `STORAGE_PATH` | `./uploads` | File storage directory |
| `HIGH_CONFIDENCE_THRESHOLD` | `0.90` | CV confidence threshold |
| `MEDIUM_CONFIDENCE_THRESHOLD` | `0.75` | Review confidence threshold |

### Frontend Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL |

---

## Scaling Considerations

### Horizontal Scaling

GarmentCV can be scaled horizontally by running multiple backend instances behind a load balancer. Considerations:

1. **Database** -- Use a managed PostgreSQL service or dedicated DB servers
2. **Storage** -- Shared filesystem (NFS) or cloud storage (S3) required for multiple instances
3. **Sessions** -- JWT tokens are stateless, so no session affinity needed
4. **Cache** -- Consider adding Redis for caching if needed

### Vertical Scaling

Increase resources (CPU, RAM) for:
- **Backend** -- More workers for concurrent API requests
- **Database** -- More connections and better query performance
- **Storage** -- Faster disks (SSD) for image I/O

---

## Monitoring & Logging

### Health Checks

- `GET /api/health` - Basic liveness probe
- `GET /api/products` (with auth) - Readiness probe (checks DB connectivity)

### Logging

Backend logs to stdout (configured via Uvicorn). In production:
- Forward logs to a centralized system (ELK stack, Datadog, etc.)
- Set appropriate log levels (INFO in production, DEBUG in development)

### Metrics

Currently no built-in metrics endpoint. Consider adding:
- Prometheus metrics endpoint
- Request latency histograms
- Error rate counters

---

## Backup & Disaster Recovery

### Database Backups

```bash
# PostgreSQL dump
docker exec garmentcv-db pg_dump -U postgres garmentcv > backup.sql

# Or using host pg_dump
pg_dump -h localhost -p 5432 -U postgres garmentcv > backup.sql
```

### File System Backups

The `uploads/` directory contains all user-uploaded images. Back it up regularly:
```bash
# Copy uploads directory
cp -r uploads/ uploads-backup-$(date +%Y%m%d).tar.gz
```

### Full Backup Strategy

1. Daily database dump
2. Hourly uploads rsync to remote storage
3. Weekly full backup test restore

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Cannot connect to database | Check `DATABASE_URL` in .env; ensure db service is running |
| Image uploads fail | Check uploads directory permissions; ensure STORAGE_PATH is writable |
| JWT auth fails | Verify SECRET_KEY is consistent across restarts; check token expiry |
| Frontend can't reach API | Verify VITE_API_URL in frontend .env; check CORS settings |
| Database migration fails | Check alembic version table; manually resolve conflicts |

### Log Locations

- **Backend:** Container stdout (visible via `docker-compose logs backend`)
- **Frontend:** Browser console and Vite dev server output
- **Database:** PostgreSQL logs in container (access via `docker-compose logs db`)

### Container Commands

```bash
# View logs
docker-compose logs -f backend

# Exec into container
docker-compose exec backend bash
docker-compose exec db psql -U postgres garmentcv

# Check container status
docker-compose ps
```

---

## Upgrading

To upgrade to a new version:

```bash
# Pull new code
git pull origin main

# Rebuild images
docker-compose build

# Apply any new migrations
docker-compose exec backend alembic upgrade head

# Restart services
docker-compose up -d
```

Always check CHANGELOG.md for breaking changes before upgrading.