# GarmentCV - Documentation Index

> Automated garment measurement platform powered by computer vision.

Welcome to the GarmentCV documentation. This index links to every documentation file in the `docs/` folder, covering the full system architecture, tech stack, APIs, deployment, and roadmap.

---

## Documentation Files

| # | Document | Description |
|---|----------|-------------|
| 01 | [Project Overview](01-overview.md) | Introduction, goals, and high-level summary |
| 02 | [System Architecture](02-architecture.md) | Three-tier architecture, design patterns, data flow |
| 03 | [Technology Stack](03-tech-stack.md) | Complete list of languages, frameworks, and libraries |
| 04 | [Project Structure](04-project-structure.md) | Directory layout and file organization |
| 05 | [Backend API Reference](05-backend-api.md) | All REST endpoints with request/response examples |
| 06 | [Database & Models](06-database-models.md) | ORM models, schemas, relationships, and migrations |
| 07 | [Authentication & Security](07-authentication.md) | JWT auth flow, password hashing, CORS, guards |
| 08 | [Frontend Architecture](08-frontend.md) | React SPA, routing, pages, components, design system |
| 09 | [File Storage System](09-storage.md) | Local storage provider, upload flow, serving images |
| 10 | [Service & Repository Layers](10-services-layer.md) | Business logic layer, data access patterns |
| 11 | [Calibration System](11-calibration.md) | Camera calibration workflow and API |
| 12 | [Product Lifecycle](12-product-lifecycle.md) | Status state machine and workflow transitions |
| 13 | [Deployment Guide](13-deployment.md) | Docker, Docker Compose, production setup |
| 14 | [Environment & Configuration](14-environment-config.md) | Environment variables, settings, secrets management |
| 15 | [Testing Guide](15-testing.md) | Testing strategy, tools, and directory structure |
| 16 | [Roadmap & Future Plans](16-roadmap.md) | ML pipeline, planned features, known limitations |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/<your-org>/garmentcv.git
cd garmentcv

# Start all services with Docker Compose
docker-compose up --build

# Or run locally:
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

- **Backend API:** http://localhost:8000
- **Frontend UI:** http://localhost:5173
- **API Docs (Swagger):** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/api/health

---

## License

See [LICENSE](../LICENSE) in the project root.
