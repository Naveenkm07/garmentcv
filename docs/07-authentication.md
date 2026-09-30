# 07 - Authentication & Security

Detailed documentation of the authentication system, JWT tokens, password handling, and security configuration.

---

## Overview

GarmentCV uses a **stateless JWT (JSON Web Token) Bearer authentication** scheme:

1. Client sends email + password to `POST /api/auth/login`
2. Server verifies credentials and returns a signed JWT
3. Client includes the JWT in every subsequent request's `Authorization` header
4. Server validates the JWT on each protected endpoint

---

## Authentication Flow

```
Client                              Server
  |                                    |
  |-- POST /api/auth/login ---------->|
  |   { username, password }          |
  |                                   |-- Lookup user by email
  |                                   |-- Verify bcrypt hash
  |                                   |-- Generate JWT (HS256)
  |<-- { access_token, token_type } --|
  |                                    |
  |-- GET /api/products ------------->|
  |   Authorization: Bearer <token>   |
  |                                   |-- Decode JWT
  |                                   |-- Extract email from "sub"
  |                                   |-- Load User from DB
  |                                   |-- Check is_active
  |<-- [products...] ----------------|
```

---

## JWT Token Structure

### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload
```json
{
  "sub": "user@example.com",
  "role": "OPERATOR",
  "exp": 1705420800
}
```

| Claim | Description |
|-------|-------------|
| `sub` | User email (subject) |
| `role` | User role (`ADMIN`, `SUPERVISOR`, `OPERATOR`, `VIEWER`) |
| `exp` | Expiration timestamp (UTC) |

### Signature

HMAC-SHA256 signed with `SECRET_KEY` from environment.

---

## Token Lifetime

| Setting | Value | Configurable |
|---------|-------|-------------|
| Algorithm | HS256 | Via `ALGORITHM` env var |
| Expiry | 1440 minutes (24 hours) | Via `ACCESS_TOKEN_EXPIRE_MINUTES` env var |
| Refresh tokens | Not implemented | - |

---

## Password Handling

### Hashing

Passwords are hashed with **bcrypt** via the `passlib` library:

```python
# app/core/security.py

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

- bcrypt automatically handles salt generation
- Work factor (cost) uses passlib defaults (~12 rounds)
- Plain-text passwords are never stored or logged

---

## JWT Guard (`deps.py`)

Protected endpoints declare a dependency on `get_current_active_user`:

```python
# app/api/deps.py

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=401, ...)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
```

### Usage in Routes

```python
@router.get("/api/products")
def get_products(current_user: User = Depends(get_current_active_user)):
    # current_user is guaranteed to be authenticated and active
    ...
```

---

## User Roles

| Role | Description | Intended Permissions |
|------|-------------|---------------------|
| `ADMIN` | Full system access | All operations, user management |
| `SUPERVISOR` | Review and approval | Approve/reject measurements, manage products |
| `OPERATOR` | Daily operations | Create products, upload images, add measurements |
| `VIEWER` | Read-only access | View products and reports |

> **Note:** Role-based access control (RBAC) checks are not yet enforced at the endpoint level. The role is stored in the JWT and database but not checked against specific endpoints. This is a planned enhancement.

---

## CORS Configuration

```python
# app/main.py

_ALLOWED_ORIGINS = [
    "http://localhost:5173",      # Vite dev server
    "http://127.0.0.1:5173",
    "http://localhost:3000",      # Alternative dev port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- **Explicit origins** -- wildcards are not used with `allow_credentials=True` (browser spec violation).
- **Production:** Add your production domain to `_ALLOWED_ORIGINS` or move the list to an environment variable.

---

## Client-Side Token Storage

The frontend stores the JWT in `localStorage`:

```typescript
// Login
localStorage.setItem('token', data.access_token)

// API calls
fetch(url, {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// Logout
localStorage.removeItem('token')
```

### Security Considerations

| Concern | Current State | Recommendation |
|---------|--------------|----------------|
| XSS exposure | `localStorage` is accessible to JS | Consider `httpOnly` cookies for production |
| Token expiry handling | No client-side expiry check | Add token decode to check `exp` before requests |
| Refresh tokens | Not implemented | Add refresh token flow for long sessions |
| CSRF | Not applicable (Bearer tokens, not cookies) | Only relevant if switching to cookie auth |

---

## Secret Key Management

| Environment | Secret Key |
|-------------|-----------|
| Development | Generated 64-char hex key in `.env` |
| Production | **Must** use a cryptographically strong random key |

Generate a production key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

The key **must** remain constant across server restarts. Changing it invalidates all existing tokens.

---

## Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT with HS256 signing
- [x] CORS with explicit origin list
- [x] UUID file naming (prevents path traversal)
- [x] SQLAlchemy parameterized queries (SQL injection prevention)
- [x] Secure random secret key
- [ ] Role-based endpoint authorization (planned)
- [ ] Rate limiting (planned)
- [ ] httpOnly cookie option (planned)
- [ ] Refresh token rotation (planned)
- [ ] Account lockout after failed attempts (planned)
- [ ] Password strength validation (planned)
