# 01 - Project Overview

## What is GarmentCV?

GarmentCV is an automated garment measurement platform that uses computer vision (CV) to capture precise clothing dimensions from photographs. It replaces manual tape-measure workflows with a camera-based pipeline that detects edges, segments garment regions, and computes measurements in millimeters.

The system is designed for fashion brands, quality-control teams, and e-commerce operations that need accurate, repeatable garment measurements at scale.

---

## Goals

1. **Automate measurement capture** -- Photograph a garment against a calibrated background and receive length, shoulder, waist, chest, hip, inseam, outseam, and sleeve measurements automatically.
2. **Confidence scoring** -- Every CV-generated measurement carries a confidence score. High-confidence measurements are accepted automatically; low-confidence measurements are routed to a human reviewer.
3. **Audit trail** -- Every action (product creation, measurement approval, image upload) is logged with the user, timestamp, and old/new values.
4. **Role-based access** -- Four roles (`ADMIN`, `SUPERVISOR`, `OPERATOR`, `VIEWER`) govern who can create, review, and approve measurements.
5. **Scalability** -- The architecture separates concerns into API, service, repository, and storage layers so each can be scaled or swapped independently.

---

## Current State

| Area | Status |
|------|--------|
| Backend API (FastAPI) | Functional -- auth, products, calibration endpoints |
| Frontend (React SPA) | Functional -- login, dashboard, catalog, new product, calibration |
| Database (SQLAlchemy ORM) | Functional -- all models aligned with migration |
| Service / Repository layers | Implemented |
| Storage abstraction | Implemented (local filesystem) |
| ML / CV pipeline | **Not yet implemented** (placeholder `ml/` directory) |
| Tests | **Not yet written** (placeholder `tests/` directory) |

---

## Key Concepts

### Product
A garment tracked through the system. Each product has a unique SKU, optional metadata (brand, color, size label), a status indicating where it is in the measurement workflow, and attached images and measurements.

### Calibration
Before the CV pipeline can convert pixel distances to millimeters, the camera must be calibrated using a reference object of known physical size (e.g., A4 paper, checkerboard, ruler). The calibration record stores the reference dimensions, marker configuration, and camera resolution.

### Measurement
A dimension captured for a product (e.g., shoulder width = 420 mm). Measurements can be generated automatically by the CV pipeline or entered manually. Each measurement has a type, a value in millimeters, and a confidence score.

### Audit Log
An immutable record of every significant action. Used for compliance, debugging, and quality reporting.

---

## Who is This For?

- **Fashion brands** needing consistent size-chart data across production runs.
- **QC teams** verifying that manufactured garments match design specifications.
- **E-commerce platforms** generating accurate size recommendations to reduce returns.
- **Developers** building or extending the platform.

---

## Quick Links

| Resource | URL |
|----------|-----|
| API Swagger docs | http://localhost:8000/docs |
| Frontend | http://localhost:5173 |
| Health check | http://localhost:8000/api/health |
