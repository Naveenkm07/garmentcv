# 03 - Technology Stack

A complete reference of every technology, library, and tool used in GarmentCV.

---

## Backend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Language | Python | 3.11 | Core backend language |
| Web Framework | FastAPI | >= 0.100.0 | Async-capable REST API framework |
| ASGI Server | Uvicorn | latest | Production-grade ASGI server |
| ORM | SQLAlchemy | >= 2.0 | Object-relational mapper for database access |
| Migrations | Alembic | >= 1.11 | Database schema migration tool |
| Validation | Pydantic | v2 | Request/response schema validation |
| Settings | pydantic-settings | latest | Environment variable management |
| Auth (JWT) | PyJWT | >= 2.8 | JSON Web Token creation and verification |
| Auth (Passwords) | passlib[bcrypt] | latest | Password hashing with bcrypt |
| File Uploads | python-multipart | latest | Multipart form data parsing for file uploads |
| DB Driver (Prod) | psycopg2-binary | latest | PostgreSQL driver |
| DB (Dev) | SQLite | built-in | Lightweight dev database |
| Env Files | python-dotenv | latest | `.env` file loading |
| CV (planned) | opencv-python | >= 4.8 | Computer vision processing |
| Numerical (planned) | numpy | >= 1.24 | Array/matrix operations for CV |
| Imaging (planned) | Pillow | >= 10.0 | Image manipulation and format conversion |

### Backend Dependencies (`requirements.txt`)

```
fastapi>=0.100.0
uvicorn
sqlalchemy>=2.0
alembic>=1.11
pydantic>=2.0
pydantic-settings
python-dotenv
python-multipart
PyJWT>=2.8
passlib[bcrypt]
psycopg2-binary
opencv-python>=4.8
numpy>=1.24
Pillow>=10.0
```

---

## Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Language | TypeScript | ~6.0 | Typed JavaScript superset |
| UI Library | React | 19 | Component-based UI |
| Build Tool | Vite | 8 | Fast dev server and production bundler |
| Routing | React Router DOM | v7 | Client-side routing |
| Icons | lucide-react | latest | SVG icon library |
| Linter | oxlint | latest | Fast JavaScript/TypeScript linter |

### Frontend Dependencies (`package.json`)

```json
{
  "dependencies": {
    "lucide-react": "latest",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "oxlint": "latest",
    "typescript": "~6.0",
    "vite": "^8.0.0"
  }
}
```

### Notable: No CSS Framework

The frontend uses a **hand-crafted CSS design system** defined in `src/index.css`:
- CSS custom properties (variables) for theming
- Glassmorphism effects (`backdrop-filter: blur`)
- Responsive grid layouts
- Custom button, input, and panel components
- No Tailwind, Bootstrap, or MUI dependency

---

## Infrastructure

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Containerization | Docker | latest | Service isolation |
| Orchestration | Docker Compose | v3.8 | Multi-container management |
| Database (prod) | PostgreSQL | 15 | Production-grade relational DB |
| OS Base (backend) | python:3.11-slim | - | Minimal Python container |
| OS Base (frontend) | node:20-alpine | - | Minimal Node.js container |

---

## Development Tools

| Tool | Purpose |
|------|---------|
| Alembic CLI | Database migration management |
| Swagger UI | Auto-generated API documentation at `/docs` |
| ReDoc | Alternative API docs at `/redoc` |
| Vite HMR | Hot module replacement for instant frontend updates |
| Uvicorn `--reload` | Auto-restart backend on file changes |

---

## Why These Choices?

### FastAPI over Flask/Django
- Native async support (future WebSocket readiness)
- Automatic OpenAPI/Swagger documentation
- Pydantic-based request validation with zero boilerplate
- Dependency injection built into the framework

### SQLAlchemy 2.0 over Django ORM
- Framework-agnostic (works with FastAPI, Flask, or standalone)
- Mature migration tooling (Alembic)
- Explicit query construction with full SQL control

### React 19 + Vite over Next.js
- Pure SPA architecture (no SSR needed for an internal tool)
- Vite provides sub-second HMR and fast builds
- Simpler deployment (static files + API)

### PyJWT over python-jose
- Actively maintained, focused on JWT
- Smaller dependency footprint
- Standard HS256/RS256 support
