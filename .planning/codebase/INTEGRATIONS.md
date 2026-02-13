# External Integrations

**Analysis Date:** 2026-02-13

## APIs & External Services

**Backend REST API:**
- Service: Tenuto.io Backend (Node.js/Express)
- What it's used for: All data operations (students, teachers, orchestras, lessons, bagrut, imports)
- SDK/Client: Custom HTTP client in `src/services/apiService.js` (4800+ lines)
- Authentication: Bearer token in Authorization header
- Base URL: `http://localhost:3001/api` (via `VITE_API_URL`)
- Timeout: 30 seconds
- Features:
  - Request deduplication (prevent duplicate POSTs)
  - Automatic retry on 404/403 with no retry, up to 3 retries on other failures
  - Token refresh mechanism for 401 Unauthorized
  - Cache-Control header support

**WebSocket Real-time Service:**
- SDK: Socket.IO Client 4.8.1
- Service: Backend Socket.IO server (same base URL)
- Implementation: `src/services/websocketService.ts`, `src/services/cascadeWebSocket.js`
- Uses:
  - Student data updates (real-time reflection across users)
  - Cascade deletion operation streaming
  - Attendance updates
  - Schedule notifications
  - Document updates
- Configuration:
  - URL: `VITE_API_URL` with `/api` suffix removed
  - Reconnect delay: 1000ms, max 5 attempts
  - Heartbeat interval: 30 seconds
  - Connection timeout: 10 seconds
- Message Types:
  - `student_update` - Field changes with updatedBy tracking
  - `attendance_update` - Lesson attendance status changes
  - `schedule_update` - Calendar/schedule notifications
  - `document_update` - Document uploads/changes
  - `heartbeat` - Keep-alive pings

## Data Storage

**Databases:**
- MongoDB (via Backend API)
  - Connection: Managed by backend at `mongodb://...` (env configured)
  - Client: MongoDB Native Driver (backend only)
  - Frontend interaction: Exclusively through REST API

**File Storage:**
- Local filesystem only
- File handling: `src/services/fileHandlingService.ts`
- Upload mechanism: Multipart form data via apiService
- Supported formats:
  - Excel: `.xlsx` files (via xlsx library) for import
  - PDF: Generated locally via jsPDF for export/reports

**Caching:**
- React Query Cache (`@tanstack/react-query`)
  - Stale time: 5 minutes default
  - Cache invalidation on mutations
- Browser localStorage
  - Auth tokens (authToken)
  - User session data (userRole, loginType, tenantId)
  - Super admin user data (superAdminUser)
- Browser sessionStorage
  - Alternative token storage for session-only auth

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication (Backend provides tokens)
- Implementation: `src/services/authContext.jsx`
- Token storage:
  - Primary: `localStorage.authToken`
  - Fallback: `sessionStorage.authToken`
  - Tokens obtained from backend login endpoint

**Multi-tenant Support:**
- Tenant selection flow (backend returns `TENANT_SELECTION_REQUIRED`)
- Implementation: `src/pages/Login` handles tenant prompt
- Tenant ID stored in localStorage, passed to backend in requests

**Super Admin Mode:**
- Special JWT token for super admin login
- Storage: `localStorage.superAdminUser` (JSON serialized user data)
- Special endpoint validation: `superAdminService.getTenants()`
- Feature flag: `loginType === 'super_admin'` in localStorage

**Role-Based Access:**
- Frontend role mapping:
  - 'מנהל' → 'admin'
  - 'מורה' → 'teacher'
  - 'מנצח' → 'conductor'
  - 'מדריך תדר' / 'מורה תיאוריה' → 'theory-teacher'
- Roles stored in user object, checked in protected routes

## Monitoring & Observability

**Error Tracking:**
- Sentry (optional, via `VITE_SENTRY_DSN`)
- Service: `src/services/errorTrackingService.ts`
- Implementation: Error reporting for frontend crashes
- Status: Configuration available but not enabled by default

**Logging:**
- Console-based logging in development
- Services include logging:
  - `src/services/apiService.js` - API calls, auth failures, retries
  - `src/services/websocketService.ts` - Socket events
  - `src/services/cascadeDeletionService.ts` - Deletion operations
  - `src/services/healthCheckService.ts` - Health monitoring

**Performance Monitoring:**
- Feature flag: `VITE_ENABLE_PERFORMANCE_MONITORING`
- Service: `src/performance/` (performance monitoring modules)
- Monitors: React Query metrics, component render times, cascade deletion performance
- Dashboard analytics: `src/services/enhancedDashboardAnalytics.ts`

**Audit Trail:**
- Service: `src/services/auditTrailService.ts`
- Tracks: User actions, deletions, updates
- Deletion audit: `VITE_ENABLE_DELETION_AUDIT` flag

## CI/CD & Deployment

**Hosting:**
- Deployment target: Vercel or similar (static hosting with SPA support)
- Build output: `dist/` directory (optimized Vite bundle)
- Asset routing: SPA index.html fallback for client-side routing

**CI Pipeline:**
- Platform: GitHub Actions
- Config: `.github/workflows/ci.yml`
- Stages (progressive):
  1. Build - Vite compilation
  2. TypeScript - Type checking (`npm run typecheck`)
  3. Lint - ESLint validation (`npm run lint`)
  4. Tests - Vitest unit/integration (`npm run test`)
  5. Deploy Staging - Conditional on tests passing
  6. Deploy Production - Conditional on all previous stages
- Pre-commit hooks: Optional (can enable)

## Environment Configuration

**Required env vars:**
- `VITE_API_URL` - Backend API base URL (default: http://localhost:3001/api)

**Feature flags (optional):**
- `VITE_CASCADE_DELETION_ENABLED` - Enable cascade deletion UI
- `VITE_FEATURE_CASCADE_DELETION_PREVIEW` - Preview mode for deletion impacts
- `VITE_FEATURE_CASCADE_DELETION_EXECUTE` - Allow executing deletions
- `VITE_FEATURE_BULK_DELETION_ENABLED` - Multi-select deletion mode
- `VITE_ENABLE_PERFORMANCE_MONITORING` - Performance tracking
- `VITE_ANALYTICS_ENABLED` - Analytics collection

**Security configuration:**
- `VITE_MAX_DELETION_REQUESTS_PER_MINUTE` - Rate limit deletions (default: 10)
- `VITE_ENABLE_DELETION_RATE_LIMITING` - Enforce rate limits

**Cascade deletion specific:**
- `VITE_DELETION_BATCH_LIMIT` - Records per batch (default: 10)
- `VITE_DELETION_TIMEOUT_MS` - Operation timeout (default: 30000ms)
- `VITE_WEBSOCKET_DELETION_CHANNEL` - Socket.IO event name

**Secrets location:**
- Never committed to repo
- `.env` file (git-ignored)
- Deployment platform secrets (GitHub Actions, Vercel, etc.)

## Webhooks & Callbacks

**Incoming:**
- Socket.IO events from backend (see WebSocket Real-time Service section)
- No external webhook endpoints

**Outgoing:**
- HTTP requests to backend REST API only
- Socket.IO emit events to backend (WebSocket push)
- Analytics events (if enabled, sent to Sentry or monitoring service)

## Data Export & Import

**Excel Import:**
- Service: File upload handling in `src/services/fileHandlingService.ts`
- Format: `.xlsx` (Excel workbook)
- Parser: `xlsx` library (v0.18.5)
- Use case: Bulk student/teacher import (F5 feature)
- Endpoint: Backend import API

**PDF Export:**
- Library: jsPDF 3.0.1 + jspdf-autotable 5.0.2
- Uses: Ministry Reports generation (F5 feature)
- Generation: Client-side PDF creation from data in memory

## Backend API Contract

**Key Endpoints Used:**
- Authentication: `/auth/login`, `/auth/logout`, `/auth/refresh`
- Students: GET/POST/PUT/DELETE `/students/*`
- Teachers: GET/POST/PUT/DELETE `/teachers/*`
- Orchestras: GET/POST/PUT/DELETE `/orchestras/*`
- Lessons: GET/POST/PUT/DELETE `/lessons/*`
- Bagrut: GET/POST/PUT/DELETE `/bagrut/*`
- Theory Lessons: GET/POST/PUT/DELETE `/theory-lessons/*`
- Import: POST `/import/students`, `/import/teachers`
- Reports: GET `/reports/ministry`
- Health: GET `/health/*` (cascade deletion checks)

**Response Format:**
- JSON with consistent structure
- Success: `{ data: {...}, status: 200 }`
- Error: `{ error: {...}, status: 4xx/5xx }`

**Authentication Method:**
- Header: `Authorization: Bearer {token}`
- Token obtained from login endpoint
- Token refresh via endpoint or re-login

---

*Integration audit: 2026-02-13*
