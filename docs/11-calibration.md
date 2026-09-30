# 11 - Calibration System

Documentation of the camera calibration workflow, API, and frontend integration.

---

## Purpose

Before the CV pipeline can convert pixel distances to real-world millimeters, the system must know the **pixel-to-mm ratio** for the current camera setup. Calibration is performed by photographing a **reference object** of known physical dimensions (A4 paper, checkerboard, ruler) and storing the relationship.

---

## Calibration Workflow

```
1. Operator selects reference object type
2. Operator photographs the reference object with the camera
3. System stores the image and reference dimensions
4. (Future) CV pipeline detects reference edges and computes px/mm ratio
5. All subsequent measurements use this calibration for conversion
```

---

## Reference Objects

| Type | Dimensions (mm) | Use Case |
|------|-----------------|----------|
| A4 Paper | 210 x 297 | Most common; easy to source |
| Checkerboard | 100 x 100 | High-precision calibration |
| Standard Ruler | 300 x 30 | Quick calibration |

---

## Backend API

### Create Calibration

**Endpoint:** `POST /api/calibrations`

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `file` | File | Yes | - | Reference image (JPEG/PNG) |
| `reference_width_mm` | float | Yes | - | Known width of reference object |
| `reference_height_mm` | float | Yes | - | Known height of reference object |
| `reference_type` | string | No | `"a4"` | `a4`, `checkerboard`, `ruler` |
| `camera_distance_cm` | float | No | - | Approximate camera distance |
| `camera_id` | integer | No | - | FK to `camera_sources` table |

**Response:**
```json
{
  "id": 1,
  "camera_id": null,
  "reference_width_mm": 210.0,
  "reference_height_mm": 297.0,
  "marker_configuration": {
    "reference_type": "a4",
    "image_filename": "cal_abc123.jpg",
    "camera_distance_cm": 150.0
  },
  "operator_id": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### List Calibrations

**Endpoint:** `GET /api/calibrations`

Returns all calibrations, newest first, with pagination (`skip`, `limit`).

### Get Latest Calibration

**Endpoint:** `GET /api/calibrations/latest`

Returns the most recent calibration record.

---

## Backend Implementation

**File:** `backend/app/api/calibration.py`

```python
@router.post("", response_model=CalibrationResponse)
def create_calibration(
    reference_width_mm: float = Form(...),
    reference_height_mm: float = Form(...),
    reference_type: str = Form("a4"),
    camera_distance_cm: Optional[float] = Form(None),
    camera_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # 1. Save reference image to uploads/calibration/
    # 2. Create Calibration record with reference dimensions
    # 3. Store reference metadata in marker_configuration JSON
    # 4. Return created calibration
```

### Image Storage

Calibration images are stored in a `calibration/` subdirectory:

```
uploads/
|-- calibration/
|   |-- cal_{uuid}.jpg
|   |-- cal_{uuid}.png
```

---

## Database Model

**Table:** `calibrations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer PK | Unique identifier |
| `camera_id` | Integer FK | References `camera_sources` |
| `reference_width_mm` | Float | Known width in mm |
| `reference_height_mm` | Float | Known height in mm |
| `marker_configuration` | JSON | Reference type, image filename, camera distance |
| `camera_resolution` | String | Camera resolution (e.g. "1920x1080") |
| `operator_id` | Integer FK | User who calibrated |
| `created_at` | DateTime | Timestamp |

### `marker_configuration` JSON Schema

```json
{
  "reference_type": "a4",
  "image_filename": "cal_{uuid}.jpg",
  "camera_distance_cm": 150.0
}
```

---

## Frontend Integration

**File:** `frontend/src/pages/Calibration.tsx`

### UI Layout

```
+-----------------------------------+
|  Camera Calibration    [Status]   |
|  Upload a reference image...      |
|                                   |
| +---------------+  +------------+ |
| | Reference     |  | Settings   | |
| | Image         |  |            | |
| |               |  | Type: [A4] | |
| | [Upload area] |  | Dist: [150]| |
| |  or           |  |            | |
| | [Image prev.] |  | [Success]  | |
| |               |  |            | |
| |               |  | [Calibrate]| |
| +---------------+  +------------+ |
+-----------------------------------+
```

### User Flow

1. **Upload** -- Click the upload area or drag-and-drop a reference image
2. **Configure** -- Select reference object type (presets width/height) and enter camera distance
3. **Calibrate** -- Click "Start Calibration" button
4. **Wait** -- Spinner overlay while API call completes
5. **Success** -- Green badge shows "System Calibrated (#ID)"
6. **Error** -- Red error banner with message
7. **Recalibrate** -- Button changes to "Recalibrate System"

### API Call

```typescript
const formData = new FormData()
formData.append('file', selectedFile)
formData.append('reference_width_mm', String(ref.width))
formData.append('reference_height_mm', String(ref.height))
formData.append('reference_type', referenceType)
formData.append('camera_distance_cm', cameraDistance)

const res = await fetch(`${API_URL}/api/calibrations`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
})
```

---

## Future: CV Pipeline Integration

When the `ml/calibration/` module is implemented, the calibration endpoint will:

1. Accept the reference image
2. Run edge detection to find the reference object
3. Compute the pixel-to-mm ratio automatically
4. Store the computed ratio in `marker_configuration`
5. Use ArUco markers (if available) for sub-pixel accuracy

The current implementation stores the reference data and image for manual/future use.
