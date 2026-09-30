from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.config import settings
from app.core.database import Base, engine
from app.models import * # ensure models are registered with Base

# Create tables for development if they don't exist (in prod, use Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# CORS: list explicit origins so allow_credentials=True is valid.
# Add production origins here or move to settings/env var.
_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images as static files at /uploads/{filename}
os.makedirs(settings.STORAGE_PATH, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.STORAGE_PATH), name="uploads")

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

from app.api import auth, products, calibration
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(calibration.router, prefix="/api/calibrations", tags=["calibration"])
