# 05 - Backend API Reference

Complete REST API reference for the GarmentCV backend. All endpoints are served at `http://localhost:8000`.

Interactive documentation is also available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## Authentication

All endpoints under `/api/products` and `/api/calibrations` require a **Bearer JWT token** in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Obtain a token via `POST /api/auth/login`.

---

## Endpoints

### Health Check

#### `GET /api/health`

**Auth:** None

**Response:**
```json
{
  "status": "ok"
}
```

---

### Auth

#### `POST /api/auth/login`

Login and receive a JWT access token.

**Auth:** None  
**Content-Type:** `application/x-www-form-urlencoded` (OAuth2 password form)

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | User email address |
| `password` | string | Yes | User password |

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error (401):**
```json
{
  "detail": "Incorrect email or password"
}
```

---

#### `POST /api/auth/register`

Register a new user.

**Auth:** None  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "operator@example.com",
  "password": "strongpassword123",
  "role": "OPERATOR"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | string | Yes | - | Unique email address |
| `password` | string | Yes | - | Plain-text password (hashed server-side) |
| `role` | string | No | `"OPERATOR"` | One of: `ADMIN`, `SUPERVISOR`, `OPERATOR`, `VIEWER` |

**Response (200):**
```json
{
  "id": 1,
  "email": "operator@example.com",
  "role": "OPERATOR",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": null
}
```

**Error (400):**
```json
{
  "detail": "A user with this email already exists."
}
```

---

### Products

#### `POST /api/products`

Create a new product.

**Auth:** Bearer JWT  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "sku": "TEE-BLK-M-001",
  "product_code": "TEE001",
  "name": "Classic Black T-Shirt",
  "category_id": 1,
  "brand": "BasicWear",
  "color": "Black",
  "size_label": "M"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sku` | string | Yes | Unique stock-keeping unit |
| `product_code` | string | No | Additional product code |
| `name` | string | No | Human-readable product name |
| `category_id` | integer | No | Category reference |
| `brand` | string | No | Brand name |
| `color` | string | No | Color description |
| `size_label` | string | No | Size label (S, M, L, XL, etc.) |

**Response (200):** Full `ProductResponse` object (see schema below).

**Error (400):** `"Product with this SKU already exists"`

---

#### `GET /api/products`

List products with pagination.

**Auth:** Bearer JWT

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `skip` | integer | 0 | Offset for pagination |
| `limit` | integer | 100 | Max results to return |

**Response (200):** Array of `ProductResponse` objects.

---

#### `GET /api/products/{product_id}`

Get a single product by ID.

**Auth:** Bearer JWT

**Response (200):** `ProductResponse` object.

**Error (404):** `"Product not found"`

---

#### `PUT /api/products/{product_id}`

Update product fields.

**Auth:** Bearer JWT  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "name": "Updated Name",
  "status": "VERIFIED"
}
```

All fields are optional. Only provided fields are updated.

---

#### `DELETE /api/products/{product_id}`

Delete a product and its associated images from disk.

**Auth:** Bearer JWT

**Response:** `204 No Content`

---

#### `POST /api/products/{product_id}/images`

Upload a product image.

**Auth:** Bearer JWT  
**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | Image file (JPEG, PNG) |
| `image_type` | string | Yes | e.g., `FRONT`, `BACK`, `SIDE` |
| `capture_source` | string | No (default `WEBCAM`) | e.g., `WEBCAM`, `MOBILE`, `DSLR` |

**Response (200):** Updated `ProductResponse` with the new image in `images[]`.

**Side Effect:** If product status is `DRAFT`, it transitions to `CAPTURING`.

---

#### `POST /api/products/{product_id}/measure`

Add a manual measurement.

**Auth:** Bearer JWT  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "measurement_type": "SHOULDER",
  "final_value_mm": 420.0,
  "measurement_method": "MANUAL",
  "confidence": 1.0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `measurement_type` | enum | Yes | `LENGTH`, `SHOULDER`, `WAIST`, `INSEAM`, `OUTSEAM`, `HIP`, `CHEST`, `SLEEVE` |
| `automatic_value_mm` | float | No | CV-generated value |
| `final_value_mm` | float | No | Accepted final value |
| `confidence` | float | No | 0.0 - 1.0 confidence score |
| `measurement_method` | string | No | `MANUAL` or `COMPUTER_VISION` |
| `review_status` | string | No | Review state |

**Side Effect:** Product status transitions to `REVIEW_REQUIRED`.

---

### Calibration

#### `POST /api/calibrations`

Create a new calibration from a reference image.

**Auth:** Bearer JWT  
**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | Reference image (A4 paper, checkerboard, etc.) |
| `reference_width_mm` | float | Yes | Known width of reference object in mm |
| `reference_height_mm` | float | Yes | Known height of reference object in mm |
| `reference_type` | string | No (default `a4`) | `a4`, `checkerboard`, `ruler` |
| `camera_distance_cm` | float | No | Approximate camera distance in cm |
| `camera_id` | integer | No | ID of camera source |

**Response (200):**
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

---

#### `GET /api/calibrations`

List calibrations (newest first).

**Auth:** Bearer JWT

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| `skip` | integer | 0 |
| `limit` | integer | 50 |

---

#### `GET /api/calibrations/latest`

Get the most recent calibration.

**Auth:** Bearer JWT

**Error (404):** `"No calibration found"`

---

### Static Files

#### `GET /uploads/{filename}`

Serve uploaded images. No authentication required.

---

## Response Schema: ProductResponse

```json
{
  "id": 1,
  "sku": "TEE-BLK-M-001",
  "product_code": "TEE001",
  "name": "Classic Black T-Shirt",
  "category_id": 1,
  "brand": "BasicWear",
  "color": "Black",
  "size_label": "M",
  "status": "DRAFT",
  "similarity_group_id": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": null,
  "images": [
    {
      "id": 1,
      "product_id": 1,
      "image_path": "abc123-def456.jpg",
      "image_type": "FRONT",
      "capture_source": "WEBCAM",
      "width": null,
      "height": null,
      "created_at": "2024-01-15T10:35:00Z"
    }
  ],
  "measurements": [
    {
      "id": 1,
      "product_id": 1,
      "measurement_type": "SHOULDER",
      "automatic_value_mm": null,
      "final_value_mm": 420.0,
      "confidence": 1.0,
      "measurement_method": "MANUAL",
      "review_status": null,
      "created_at": "2024-01-15T10:40:00Z",
      "updated_at": null
    }
  ]
}
```
