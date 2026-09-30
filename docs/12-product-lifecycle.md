# 12 - Product Lifecycle

Documentation of the product status state machine, workflow transitions, and measurement review process.

---

## Status State Machine

Every product moves through a defined lifecycle from creation to final measurement approval.

```
                DRAFT
                  |
                  | (first image uploaded)
                  v
              CAPTURING
                  |
                  | (submitted for CV processing)
                  v
              PROCESSING
                  |
                  | (measurements generated / manual entry)
                  v
           REVIEW_REQUIRED
              /        \
             /          \
            v            v
        VERIFIED      REJECTED
            |
            | (all measurements approved)
            v
        COMPLETED
```

---

## Status Definitions

| Status | Description | Entry Condition |
|--------|-------------|-----------------|
| `DRAFT` | Product created, no images yet | Product creation (`POST /api/products`) |
| `CAPTURING` | Images are being uploaded | First image upload (`POST .../images`) |
| `PROCESSING` | CV pipeline is analyzing images | (Future) Submitted to CV worker queue |
| `REVIEW_REQUIRED` | Measurements need human review | Manual measurement added (`POST .../measure`) or low CV confidence |
| `VERIFIED` | All measurements reviewed and approved | (Future) Supervisor approval |
| `COMPLETED` | Product fully measured and finalized | (Future) Final approval |
| `REJECTED` | Measurements rejected; re-measurement needed | (Future) Supervisor rejection |

---

## Currently Implemented Transitions

| From | To | Trigger | Code Location |
|------|----|---------|---------------|
| `DRAFT` | `CAPTURING` | First image uploaded | `ProductService.upload_image()` |
| Any | `REVIEW_REQUIRED` | Manual measurement added | `ProductService.add_measurement()` |

### ProductService.upload_image()

```python
# backend/app/services/product_service.py
if product.status == ProductStatus.DRAFT:
    self.repo.update(product, status=ProductStatus.CAPTURING)
```

### ProductService.add_measurement()

```python
# backend/app/services/product_service.py
self.repo.update(product, status=ProductStatus.REVIEW_REQUIRED)
```

---

## Planned Transitions (Not Yet Implemented)

| From | To | Trigger |
|------|----|---------|
| `CAPTURING` | `PROCESSING` | All required images captured, submitted to CV queue |
| `PROCESSING` | `REVIEW_REQUIRED` | CV pipeline completes; measurements generated |
| `PROCESSING` | `VERIFIED` | All CV measurements have high confidence (>= 0.90) |
| `REVIEW_REQUIRED` | `VERIFIED` | Supervisor approves measurements |
| `REVIEW_REQUIRED` | `REJECTED` | Supervisor rejects measurements |
| `VERIFIED` | `COMPLETED` | Final sign-off |
| `REJECTED` | `DRAFT` | Product returned for re-measurement |

---

## Measurement Confidence Thresholds

Defined in `app/core/config.py`:

| Setting | Value | Description |
|---------|-------|-------------|
| `HIGH_CONFIDENCE_THRESHOLD` | 0.90 | Auto-accept threshold |
| `MEDIUM_CONFIDENCE_THRESHOLD` | 0.75 | Manual review threshold |

**Planned behavior:**
- Confidence >= 0.90 --> Measurement auto-accepted
- 0.75 <= Confidence < 0.90 --> Flagged for review
- Confidence < 0.75 --> Flagged as "low confidence"; requires manual verification

---

## Measurement Types

| Type | Description |
|------|-------------|
| `LENGTH` | Total garment length (top to bottom) |
| `SHOULDER` | Shoulder width (seam to seam) |
| `WAIST` | Waist circumference |
| `INSEAM` | Inside leg length |
| `OUTSEAM` | Outside leg length |
| `HIP` | Hip circumference |
| `CHEST` | Chest circumference |
| `SLEEVE` | Sleeve length (shoulder to cuff) |

---

## Measurement Data Model

Each measurement records both the automatic (CV) and final (approved) values:

```json
{
  "measurement_type": "SHOULDER",
  "automatic_value_mm": 418.5,      // CV-generated
  "final_value_mm": 420.0,          // Reviewer-corrected or approved
  "confidence": 0.87,               // CV confidence (0-1)
  "measurement_method": "COMPUTER_VISION",  // or "MANUAL"
  "review_status": "APPROVED"       // Review state
}
```

This dual-value approach enables:
- Tracking CV accuracy over time
- Audit trails for manual corrections
- Training data collection for ML model improvement

---

## Workflow Diagram

```
Operator                  System                    Supervisor
   |                         |                          |
   |-- Create Product ------>|                          |
   |   (SKU, metadata)      [DRAFT]                     |
   |                         |                          |
   |-- Upload Images ------->|                          |
   |   (FRONT, BACK, SIDE)  [CAPTURING]                  |
   |                         |                          |
   |                         |-- CV Pipeline ---------->|
   |                        [PROCESSING]                 |
   |                         |                          |
   |                         |-- Measurements Ready --->|
   |                        [REVIEW_REQUIRED]            |
   |                         |                          |
   |                         |          Review -------->|
   |                         |          Approve/Reject   |
   |                         |                          |
   |                        [VERIFIED] or [REJECTED]     |
   |                         |                          |
   |                        [COMPLETED]                  |
```

---

## API Integration

### Checking Product Status

```bash
# Get product with current status
GET /api/products/1

# Response includes:
{
  "id": 1,
  "status": "REVIEW_REQUIRED",
  "measurements": [...],
  "images": [...]
}
```

### Updating Status Manually

```bash
# Via product update endpoint
PUT /api/products/1
{
  "status": "VERIFIED"
}
```

> **Note:** There are currently no guards preventing arbitrary status changes via the update endpoint. Status transition validation should be added as a business rule in `ProductService`.
