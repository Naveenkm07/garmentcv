# 15 - Testing Guide

Documentation for testing strategies, tools, and practices in GarmentCV.

---

## Testing Philosophy

GarmentCV follows a **testing pyramid** approach:

```
                     UI/E2E Tests
                        (Slow, Broad)
                            .
                           / \
                          /   \
                         /     \
                Integration Tests
                   (Medium, Focused)
                       .
                      / \
                     /   \
                    /     \
               Unit Tests
              (Fast, Isolated)
```

- **Unit Tests** - Fast, isolated tests of individual functions/classes
- **Integration Tests** - Test interactions between components (API + DB, service + repo)
- **UI/E2E Tests** - Test full user flows through the browser

---

## Test Directory Structure

```
tests/
|-- backend/          # Backend tests (unit, integration)
|   |-- unit/         # Unit tests for services, repositories, utils
|   |-- integration/  # API tests with test database
|   |-- fixtures/     # Shared test fixtures and factories
|   |-- conftest.py   # Pytest configuration
|
|-- frontend/         # Frontend tests (unit, integration)
|   |-- unit/         # Component unit tests
|   |-- integration/  # Page and API mocking tests
|   |-- cypress/      # Cypress E2E tests (if adopted)
|   |-- jest.config.js
|
|-- cv/               # Computer vision pipeline tests
|   |-- unit/         # Algorithm unit tests
|   |-- integration/  # Pipeline integration tests
|   |-- fixtures/     # Test images and expected outputs
|
|-- integration/      # Full system end-to-end tests
|   |-- smoke/        # Basic smoke tests
|   |-- api/          # API contract tests
|   |-- ui/           # UI workflow tests
|
|-- performance/      # Load and stress tests
|   |-- locust/       # Locust test scripts
|   |-- k6/           # K6 test scripts
|   |-- jmeter/       # JMeter test plans
|
|-- fixtures/         # Global test fixtures
|   |-- data/         # Test data (JSON, CSV)
|   |-- images/       # Test image files
|
|-- conftest.py       # Global pytest configuration (if needed)
|-- pytest.ini        # Pytest configuration
|-- jest.config.js    # Jest configuration
|-- playwright.config.js  # Playwright config (alternative to Cypress)
```

> Currently all directories are empty placeholders. This document describes the intended structure.

---

## Backend Testing

### Tools
- **Pytest** - Primary testing framework
- **pytest-mock** - Mocking utilities
- **factory_boy** or **model_mommy** - Test data factories
- **httpx** - Async HTTP client for API tests
- **SQLAlchemy** - Test database utilities

### Test Database

Backend tests use an isolated SQLite in-memory database:

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Unit Tests

Test individual classes and functions in isolation with mocks:

```python
# tests/backend/unit/test_product_service.py
def test_create_product_duplicate_sku(db_session, mocker):
    # Arrange
    repo_mock = mocker.Mock()
    repo_mock.get_by_sku.return_value = MockProduct(sku="DUP-001")  # Existing
    service = ProductService(db_session)
    service.repo = repo_mock
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        service.create_product(ProductCreate(sku="DUP-001", name="Test"))
    assert exc.value.status_code == 400
```

### Integration Tests

Test API endpoints with real database:

```python
# tests/backend/integration/test_products_api.py
def test_create_product_endpoint(client, db_session, auth_headers):
    # Arrange
    product_data = {
        "sku": "TEST-001",
        "name": "Test Product",
        "sku": "TEST-001"
    }
    
    # Act
    response = client.post(
        "/api/products",
        json=product_data,
        headers=auth_headers
    )
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["sku"] == "TEST-001"
    assert data["name"] == "Test Product"
    assert "id" in data
```

### Test Client Fixture

```python
# tests/conftest.py
@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

### Authentication Helpers

```python
# tests/conftest.py
@pytest.fixture
def auth_headers(client, db_session):
    # Create test user
    user_service = UserService(db_session)
    user = user_service.create_user(UserCreate(
        email="test@example.com",
        password="testpass123",
        role="OPERATOR"
    ))
    
    # Get token
    response = client.post(
        "/api/auth/login",
        data={"username": "test@example.com", "password": "testpass123"}
    )
    token = response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}
```

---

## Frontend Testing

### Tools
- **Jest** - JavaScript/TypeScript testing framework
- **React Testing Library** - Component testing utility
- **MSW (Mock Service Worker)** - API mocking for component tests
- **Cypress** or **Playwright** - End-to-end browser tests (alternative)

### Unit Tests

Test components in isolation with mocked API:

```typescript
// tests/frontend/unit/ProductCard.test.tsx
import { render, screen } from '@testing-library/react'
import ProductCard from '@/components/ProductCard'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.get('http://localhost:8000/api/products/1', (req, res, ctx) =>
    res.ctx.json({
      id: 1,
      sku: 'TEST-001',
      name: 'Test Product',
      status: 'DRAFT',
      images: [],
      measurements: []
    })
  )
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('displays product information', () => {
  render(<ProductCard productId={1} />)
  
  expect(screen.getByText('TEST-001')).toBeInTheDocument()
  expect(screen.getByText('Test Product')).toBeInTheDocument()
  expect(screen.getByText('DRAFT')).toBeInTheDocument()
})
```

### Integration Tests

Test pages with API mocking:

```typescript
// tests/frontend/integration/Dashboard.test.tsx
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-elect'
import Dashboard from '@/pages/Dashboard'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.get('http://localhost:8000/api/products', (req, res, ctx) =>
    res.ctx.json([
      { id: 1, sku: 'TEST-001', name: 'Test 1', status: 'DRAFT', images: [], measurements: [] },
      { id: 2, sku: 'TEST-002', name: 'Test 2', status: 'REVIEW_REQUIRED', images: [], measurements: [] },
      { id: 3, sku: 'TEST-003', name: 'Test 3', status: 'COMPLETED', images: [], measurements: [] }
    ])
  )
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('displays correct stats', async () => {
  // Mock auth
  localStorage.setItem('token', 'fake-token')
  
  render(<Dashboard />)
  
  // Wait for data to load
  expect(await screen.findByText('3')).toHaveTextContent('3') // Total
  expect(await screen.findByText('1')).toHaveTextContent('1') // Pending Review
  expect(await screen.findByText('1')).toHaveTextContent('1') // Completed
  expect(await screen.findByText('0')).toHaveTextContent('0') // Low Confidence
})
```

### E2E Tests (Cypress Example)

```typescript
// tests/frontend/cypress/e2e/product-flow.cy.ts
describe('Product Creation Flow', () => {
  beforeEach(() => {
    // Login via API command (custom)
    cy.login('test@example.com', 'testpass123')
    cy.visit('/')
  })
  
  it('should create a new product', () => {
    cy.contains('New Product').click()
    
    cy.get('input[name="sku"]').type('NEW-001')
    cy.get('input[name="name"]').type('New Test Product')
    cy.get('button').contains('Create').click()
    
    cy.contains('New Test Product').should('be.visible')
    cy.url().should('include', '/dashboard')
  })
})
```

---

## Computer Vision Testing

### Tools
- **OpenCV test utilities** - Image comparison and assertion
- **Pytest-image-diff** - Pixel-by-pixel image comparison
- **Scikit-image** - Image processing utilities for test validation

### Unit Tests

Test individual CV algorithms:

```python
# tests/cv/unit/test_segmentation.py
def test_garment_segmentation():
    # Arrange
    test_image = load_test_image('tshirt_front.jpg')
    expected_mask = load_test_mask('tshirt_front_mask.png')
    
    # Act
    mask = segment_garment(test_image)
    
    # Assert
    assert_images_similar(mask, expected_mask, threshold=0.95)
```

### Integration Tests

Test full CV pipeline:

```python
# tests/cv/integration/test_measurement_pipeline.py
def test_measurement_pipeline_with_calibration():
    # Arrange
    calibration = create_test_calibration()
    test_image = load_test_image('tshirt_with_ruler.jpg')
    known_measurements = {
        'SHOULDER': 420.0,
        'WAIST': 380.0
    }
    
    # Act
    measurements = run_measurement_pipeline(test_image, calibration)
    
    # Assert
    assert abs(measurements['SHOULDER'].final_value_mm - 420.0) < 5.0
    assert abs(measurements['WAIST'].final_value_mm - 380.0) < 5.0
```

---

## Performance Testing

### Tools
- **Locust** - Python-based load testing
- **k6** - Go-based load testing (JS scripting)
- **JMeter** - Java-based load testing
- **Artillery** - Node.js based

### Load Test Scenarios

1. **API Endpoint Load** - Concurrent requests to `/api/products`
2. **Image Upload Stress** - Concurrent multipart uploads
3. **Authentication Load** - Concurrent login requests
4. **Mixed Workflow** - Realistic user behavior simulation

### Example Locust File

```python
# tests/performance/locustfile.py
from locust import HttpUser, task, between
import random

class GarmentCVUser(HttpUser):
    wait_time = between(1, 3)
    token = None
    
    def on_start(self):
        # Login
        response = self.client.post("/api/auth/login", {
            "username": "test@example.com",
            "password": "testpass123"
        })
        self.token = response.json()["access_token"]
    
    @task(3)
    def get_products(self):
        self.client.get(
            "/api/products",
            headers={"Authorization": f"Bearer {self.token}"}
        )
    
    @task(1)
    def create_product(self):
        sku = f"TEST-{random.randint(1000,9999)}"
        self.client.post(
            "/api/products",
            json={"sku": sku, "name": f"Product {sku}"},
            headers={"Authorization": f"Bearer {self.token}"}
        )
    
    @task(1)
    def upload_image(self):
        # Mock file upload
        files = {"file": ("test.jpg", b"fake image content", "image/jpeg")}
        self.client.post(
            "/api/products/1/images",
            data={"image_type": "FRONT", "capture_source": "WEBCAM"},
            files=files,
            headers={"Authorization": f"Bearer {self.token}"}
        )
```

Run with:
```bash
locust -f tests/performance/locustfile.py --host=http://localhost:8000
```

---

## Test Data Management

### Factories

Use factory patterns for consistent test data:

```python
# tests/factories.py
import factory
from factory.alchemy import SQLAlchemyModelOrmFactory
from app.models.user import User
from app.models.product import Product, ProductStatus

class UserFactory(SQLAlchemyModelOrmFactory):
    class Meta:
        model = User
    
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    hashed_password = factory.LazyFunction(lambda: hash_password("testpass123"))
    role = "OPERATOR"
    is_active = True

class ProductFactory(SQLAlchemyModelOrmFactory):
    class Meta:
        model = Product
    
    sku = factory.Sequence(lambda n: f"SKU-{n:04d}")
    name = factory.Faker("catch_phrase")
    status = ProductStatus.DRAFT
```

### Test Fixtures

Shared test data files:

```
tests/fixtures/
|-- data/
|   |-- sample_products.json
|   |-- user_roles.csv
|-- images/
|   |-- reference/
|   |   |-- a4_paper.jpg
|   |   |-- checkerboard.png
|   |-- garments/
|       |-- tshirt_front.jpg
|       |-- jeans_side.png
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: garmentcv_test
        ports: [5432:5432]
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: "3.11"
    
    - name: Set up Node
      uses: actions/setup-node@v3
      with:
        node-version: "20"
    
    - name: Install backend dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-mock
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run backend tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/garmentcv_test
        SECRET_KEY: test-secret-key-for-ci-only
      run: |
        cd backend
        pytest tests/ -v
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test
    
    - name: Run linting
      run: |
        cd backend
        pip install flake8
        flake8 app/
        
        cd frontend
        npx oxlint .
```

---

## Test Coverage Goals

| Type | Target | Tools |
|------|--------|-------|
| Backend Unit Tests | 80%+ | pytest + coverage |
| Backend Integration Tests | 70%+ | pytest |
| Frontend Unit Tests | 70%+ | Jest + coverage |
| Frontend Integration Tests | 50%+ | React Testing Library |
| E2E Tests | Critical paths | Cypress/Playwright |
| Overall | 75%+ | Combined |

Generate coverage reports:
```bash
# Backend
cd backend
pytest --cov=app --cov-report=html --cov-report=term-missing

# Frontend
cd frontend
npm run test -- --coverage
```

---

## Writing Effective Tests

### Principles

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Each test should have one reason to fail** - Keep tests focused
3. **Tests should be deterministic** - No randomness, no time dependence
4. **Test both success and failure paths** - Negative testing is as important as positive
5. **Keep tests fast** - Unit tests should run in milliseconds
6. **Make tests readable** - Use clear names and arrange-act-assert pattern

### Test Naming Conventions

```
# Backend
test_create_product_duplicate_sku_raises_400
test_get_product_by_id_returns_correct_data
test_upload_image_transitions_status_to_capturing

# Frontend
should display product name when rendered
should show loading state while fetching data
should call API with correct headers when submitting form
```

### Anti-Patterns to Avoid

- ❌ Testing private methods directly (test through public interface)
- ❌ Hard-coded IDs in assertions (use returned values from creation)
- ❌ Tests that depend on execution order
- ❌ Over-mocking (don't mock what you don't own)
- ❌ Testing framework/library behavior (test your code, not React or FastAPI)

---

## Debugging Failing Tests

### Common Issues

| Problem | Solution |
|---------|----------|
| Non-deterministic tests | Fix random seeds, mock time, use factories |
| Database state leakage | Use transaction rollback or recreate tables between tests |
| Async test timing issues | Use proper await/waitFor patterns |
| Missing test data | Create factories/fixtures for required data |
| Environment variable missing | Set in conftest or use monkeypatch fixture |

### Debugging Techniques

1. **Run single test** - `pytest tests/backend/unit/test_product_service.py::test_create_product_duplicate_sku_raises_400 -v`
2. **Verbose output** - Add `-v` or `-vv` flags
3. **Show local variables** - `--tb=long` in pytest
4. **Use breakpoints** - `pytest --trace` or `breakpoint()` in code
5. **Check logs** - Capture logs with `caplog` fixture
6. **Visual debugging** - For frontend, use `debug()` from React Testing Library

---

## Future Testing Plans

### Short-term (Next Quarter)
- [ ] Implement backend unit tests for services and repositories
- [ ] Implement frontend unit tests for core components
- [ ] Set up CI pipeline with automated testing
- [ ] Achieve 50%+ test coverage

### Medium-term (Next 6 months)
- [ ] Implement API integration tests with test database
- [ ] Implement frontend integration tests with MSW
- [ ] Add CV unit tests for core algorithms
- [ ] Achieve 70%+ test coverage
- [ ] Add performance baseline tests

### Long-term (Next Year)
- [ ] Implement end-to-end tests with Cypress/Playwright
- [ ] Add load testing to CI (nightly)
- [ ] Implement mutation testing for critical paths
- [ ] Achieve 80%+ test coverage
- [ ] Add visual regression testing for UI

---

## Resources

### Testing Libraries
- [Pytest Documentation](https://docs.pytest.org/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Cypress](https://www.cypress.io/)
- [Playwright](https://playwright.dev/)

### Testing Books
- "Test Driven Development: By Example" - Kent Beck
- "Growing Object-Oriented Software, Guided by Tests" - Freeman & Pryce
- "Effective Software Testing" - Maurício Aniche

### Blog Posts & Articles
- "The Testing Pyramid" - Martin Fowler
- "What to Unit Test" - Google Testing Blog
- "Testing the Service Layer" - Various sources