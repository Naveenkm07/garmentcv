# 08 - Frontend Architecture

Complete documentation of the React SPA, routing, pages, components, and design system.

---

## Overview

The GarmentCV frontend is a **single-page application (SPA)** built with:

- **React 19** for UI components
- **TypeScript ~6.0** for type safety
- **Vite 8** for development server and production builds
- **React Router v7** for client-side routing
- **lucide-react** for SVG icons
- **Custom CSS** (glassmorphism design system, no framework)

---

## Entry Points

### `index.html`
The single HTML file that Vite serves. Contains the `<div id="root">` mount point.

### `src/main.tsx`
Bootstraps the React application:
```tsx
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(<App />)
```

### `src/App.tsx`
Defines all routes:
```tsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    
    <Route element={<Layout />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products/new" element={<NewProduct />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/calibration" element={<Calibration />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Route>
  </Routes>
</BrowserRouter>
```

---

## Route Map

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/login` | `Login.tsx` | No | Login and registration form |
| `/dashboard` | `Dashboard.tsx` | Yes | Live stats and recent activity |
| `/catalog` | `Catalog.tsx` | Yes | Searchable product table |
| `/products/new` | `NewProduct.tsx` | Yes | Create new product form |
| `/calibration` | `Calibration.tsx` | Yes | Camera calibration wizard |
| `/` | Redirect | Yes | Redirects to `/dashboard` |

---

## Components

### `Layout.tsx` -- Application Shell

The layout component wraps all authenticated pages and provides:

1. **Auth guard** -- checks `localStorage` for JWT token; redirects to `/login` if absent
2. **Sidebar navigation** -- vertical nav with icon links to all pages
3. **Logout button** -- clears token and redirects to login
4. **Content area** -- renders child routes via `<Outlet />`

```
+----------------------------------+
| Sidebar    |  Main Content       |
|            |                     |
| Dashboard  |  <Outlet />         |
| New Product|  (page renders here)|
| Catalog    |                     |
| Calibration|                     |
|            |                     |
| [Logout]   |                     |
+----------------------------------+
```

---

## Pages

### Login (`pages/Login.tsx`)

**Features:**
- Toggle between Login and Register modes
- Email + password form fields
- Calls `POST /api/auth/login` (form-encoded) or `POST /api/auth/register` (JSON)
- Stores JWT in `localStorage` on success
- Redirects to `/dashboard` after login

**API calls:**
- `POST ${API_URL}/api/auth/login` (OAuth2 form)
- `POST ${API_URL}/api/auth/register` (JSON body)

---

### Dashboard (`pages/Dashboard.tsx`)

**Features:**
- Four stat cards: Total Products, Pending Review, Completed, Low Confidence
- Recent products table (5 most recent)
- All data fetched live from `GET /api/products?limit=200`
- Loading and error states

**Stats computation:**
```typescript
total:          products.length
pending_review: products.filter(p => p.status === 'REVIEW_REQUIRED').length
completed:      products.filter(p => p.status === 'COMPLETED' || p.status === 'VERIFIED').length
low_confidence: products.filter(p => p.status === 'REVIEW_REQUIRED').length
```

---

### Catalog (`pages/Catalog.tsx`)

**Features:**
- Fetches all products from `GET /api/products?limit=200`
- Client-side search filtering by SKU, name, or brand
- Color-coded status badges
- Sortable table with columns: SKU, Name, Brand, Color, Size, Status, Created
- Empty state and error handling

---

### New Product (`pages/NewProduct.tsx`)

**Features:**
- Form with fields: SKU, Product Code, Name, Brand, Color, Size Label
- Submits `POST /api/products` with Bearer token
- Success/error feedback
- SKU is required; other fields are optional

---

### Calibration (`pages/Calibration.tsx`)

**Features:**
- Two-column layout: image upload (left) and settings (right)
- Reference object type selector (A4, Checkerboard, Ruler) with preset dimensions
- Camera distance input
- Image preview with upload-another option
- Submits `POST /api/calibrations` (multipart form)
- Shows calibration ID on success
- Error banner on failure
- Animated crosshair spinner during calibration

---

## API Configuration

The API base URL is configured via Vite environment variable:

```typescript
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
```

Set `VITE_API_URL` in `docker-compose.yml` or a `.env` file in the frontend directory.

---

## Authentication Pattern

Every authenticated API call follows this pattern:

```typescript
const token = localStorage.getItem('token')
const response = await fetch(`${API_URL}/api/endpoint`, {
  method: 'GET',  // or POST, PUT, DELETE
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',  // for JSON bodies
  },
  body: JSON.stringify(data),  // for POST/PUT
})
```

- No centralized API client yet (planned for `src/services/`)
- No global error handler for 401 responses (planned)
- No token refresh mechanism (planned)

---

## Design System (`index.css`)

### CSS Custom Properties

```css
:root {
  --bg-dark:          #0f0f1a;
  --bg-card:          rgba(255, 255, 255, 0.05);
  --border-color:     rgba(255, 255, 255, 0.1);
  --primary-color:    #6366f1;     /* Indigo */
  --primary-hover:    #818cf8;
  --text-primary:     #ffffff;
  --text-muted:       rgba(255, 255, 255, 0.6);
  --success:          #10b981;     /* Emerald */
  --warning:          #f59e0b;     /* Amber */
  --danger:           #ef4444;     /* Red */
}
```

### Glassmorphism Panels

```css
.glass-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
}
```

### Component Classes

| Class | Usage |
|-------|-------|
| `.glass-panel` | Card/panel container |
| `.btn` | Base button styles |
| `.btn-primary` | Primary action button (indigo) |
| `.input-field` | Text input, select, textarea |
| `.grid-cards` | Responsive CSS Grid layout |
| `.nav-item` | Sidebar navigation link |
| `.nav-item.active` | Active nav link (highlighted) |
| `.layout-container` | Flex layout (sidebar + content) |
| `.sidebar` | Fixed sidebar styles |
| `.main-content` | Scrollable content area |
| `.animate-fade-in` | Entry animation |

### Theme

The design uses a **dark theme with glassmorphism effects**:
- Dark background (`#0f0f1a`)
- Semi-transparent panels with blur
- Indigo accent color
- White text with muted secondary text
- Subtle borders and shadows

---

## Build & Development

### Development Server
```bash
cd frontend
npm install
npm run dev    # Starts Vite dev server on port 5173
```

### Production Build
```bash
npm run build  # Outputs to dist/
npm run preview  # Preview production build locally
```

### Linting
```bash
npx oxlint     # Run oxlint
```

---

## Planned Enhancements

- [ ] Centralized API service layer (`src/services/api.ts`)
- [ ] TypeScript type definitions (`src/types/`)
- [ ] Custom hooks for auth and data fetching (`src/hooks/`)
- [ ] Global auth context with token expiry checking
- [ ] Feature-based module organization (`src/features/`)
- [ ] Product detail/edit page
- [ ] Measurement review workflow UI
- [ ] Real-time dashboard updates (WebSocket)
