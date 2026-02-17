# External Integrations

**Analysis Date:** 2026-02-17

## APIs & External Services

**Backend REST API:**
- Service: Conservatory Management System Backend (Node.js + Express)
- Location: `http://localhost:3001/api` (configurable via `VITE_API_URL`)
- Client: `src/services/apiService.js` (~5350 lines, all HTTP in single file)
- Authentication: Bearer token in `Authorization` header
- Error handling: Validation errors with field-level details, 401/403/404/500 specific handling
- Request deduplication: Prevents duplicate identical requests in flight

**Real-time WebSocket Communication:**
- Service: Socket.IO (same backend)
- Client: `src/services/websocketService.ts`, `src/services/cascadeWebSocket.js`
- Channels:
  - `student.update` - Real-time student data changes
  - `attendance.update` - Attendance mark changes
  - `schedule.update` - Schedule modifications
  - `document.update` - Document uploads/deletions
  - `cascade.progress` - Cascade deletion operation progress
  - `cascade.complete` - Deletion operation completion
  - `integrity.issue` - Data integrity alerts
- Reconnection: 5 attempts with exponential backoff (1s → 30s max)
- Heartbeat: 30-second keep-alive interval

**File Upload/Download:**
- Endpoint: `/api/file/student/{studentId}` - File uploads for student records
- Endpoint: `/api/export/status` - Export operation status (Placeholder - not yet on backend)
- Endpoint: `/api/export/validate` - Export validation (Placeholder - not yet on backend)
- Endpoint: `/api/export/download` - Export file download (Placeholder - not yet on backend)
- Client: File reading via File API, XMLHttpRequest/Fetch for upload
- Supported: PDFs, documents (XLSX, CSV via import page)

## Data Storage

**Backend Database:**
- Type: MongoDB 6.13.0
- Connection: Via backend server only (not directly from frontend)
- Models: Students, Teachers, Orchestras, Rehearsals, Lessons, Attendance, Bagrut, AuditTrail
- Timezone: Asia/Jerusalem (hardcoded in Playwright tests)
- Accessed through: REST API in `src/services/apiService.js`

**Service Categories in apiService.js:**
```javascript
export const authService              // Login, token validation, refresh
export const studentService           // CRUD students, attendance, documents
export const teacherService          // Teacher profiles, assignments, schedules
export const theoryService           // Theory exams and grading
export const orchestraService        // Orchestra management and rehearsals
export const rehearsalService        // Rehearsal scheduling and records
export const schoolYearService       // School year configuration
export const bagrutService           // Israeli matriculation exam tracking
export const scheduleService         // Lesson scheduling
export const attendanceService       // Attendance management
export const tenantService           // Multi-tenant school selection
export const hoursSummaryService     // Hours tracking summaries
export const importService           // Bulk student/teacher import
export const exportService           // Export reports and data
export const superAdminService       // Super admin tenant management
export const adminAuditService       // Audit trail logging
```

**Client-Side Storage:**
- localStorage:
  - `authToken` - JWT bearer token (persistent)
  - `loginType` - 'standard' | 'super_admin' (auth type)
  - `superAdminUser` - Super admin user data snapshot
  - `recentSearches` - Global search history
  - `OFFLINE_QUEUE` - Progressive save queue (JSON)
- sessionStorage:
  - Temporary auth token if localStorage unavailable
- No persistent database on client

**File Storage:**
- Backend: AWS S3 (via `@aws-sdk/client-s3`, `@aws-sdk/lib-storage` in backend)
- Frontend: File upload only, no file preview/manipulation
- Formats: PDF, XLSX, CSV (recognized but not processed client-side except for import)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication (backend-managed)
- Implementation: React Context in `src/services/authContext.jsx`
- Flow:
  1. User logs in with credentials via `authService.login(email, password)`
  2. Backend returns JWT token
  3. Token stored in `localStorage.authToken` or `sessionStorage.authToken`
  4. All API requests include `Authorization: Bearer {token}` header
  5. On app start, `validateToken()` checks token validity
  6. 30-second auth cache to prevent validation spam
  7. Auto-logout on 401 response (critical auth endpoints only)

**Multi-Tenant Selection:**
- Super admin mode: Special login type for tenant selection
- Flow: Super admin authenticates → `superAdminService.getTenants()` → select tenant → switch to standard auth
- Auth context: `useAuth()` hook for current user, `isAuthenticated`, `user` state
- User data structure:
  ```javascript
  {
    teacherId / _id,
    personalInfo: { firstName, lastName },
    roles: ['teacher', 'admin', 'super_admin'],
    schoolId,
    email
  }
  ```

**Token Management:**
- Validation endpoint: `/auth/validate` - Check if token still valid
- Refresh endpoint: `/auth/refresh` - Request new token (not currently used)
- Logout: Remove token from storage, clear auth context
- Token decay: Server determines expiration, frontend validates on app load

## Monitoring & Observability

**Error Tracking:**
- Service: Optional Sentry integration (if `VITE_SENTRY_DSN` set)
- File: `src/services/errorTrackingService.ts`
- Initialize: Conditional Sentry setup with version tagging
- Endpoint fallback: If Sentry unavailable, post errors to `VITE_ERROR_LOGGING_ENDPOINT`
- Not currently enabled in .env.example

**Logging:**
- Frontend: Browser console only (structured logs with emoji prefixes: 🔐 for auth, 🌐 for API, etc.)
- Backend: Pino (structured JSON logging)
- Audit trail: `adminAuditService.getAuditLog()` for admin-visible changes
- Performance: Optional monitoring via `VITE_ENABLE_PERFORMANCE_MONITORING`

**Analytics:**
- Service: Optional custom analytics (if `VITE_ANALYTICS_ENABLED=true`)
- File: `src/services/analyticsService.ts`
- Endpoint: `VITE_ANALYTICS_ENDPOINT` (optional, falls back to no-op)
- Events tracked: Form submissions, page views, errors (if enabled)
- Not currently enabled in .env.example

## CI/CD & Deployment

**Hosting:**
- Static site deployment (frontend)
- Vite build output: `dist/` directory (git-ignored)
- Deployed to: TBD (configure based on platform)

**CI Pipeline:**
- GitHub Actions: `.github/workflows/ci.yml`
- Stages (progressive):
  1. **Build** - `npm run build` ✓ ENABLED
  2. **TypeScript** - `npm run typecheck` (GATE: enable after fixing TS errors)
  3. **Lint** - `npm run lint` (GATE: auto-enabled, max-warnings 0)
  4. **Tests** - `npm run test` (GATE: enable after test coverage >80%)
  5. **Deploy Staging** - Manual trigger (GATE: after all quality gates pass)
  6. **Deploy Production** - Manual trigger (GATE: after staging validation)
- Review stages before/after each phase for enabling/disabling

## Environment Configuration

**Required Environment Variables:**
```
VITE_API_URL                           # Backend API URL (default: http://localhost:3001/api)
VITE_APP_NAME                          # Application title
VITE_APP_VERSION                       # Semantic version for telemetry
```

**Feature Flags (Optional):**
```
VITE_CASCADE_DELETION_ENABLED=false     # Enable cascade deletion UI
VITE_FEATURE_CASCADE_DELETION_PREVIEW=false   # Show impact preview
VITE_FEATURE_CASCADE_DELETION_EXECUTE=false   # Allow execution
VITE_FEATURE_BULK_DELETION_ENABLED=false      # Bulk deletion support
```

**Monitoring/Debug (Optional):**
```
VITE_ENABLE_PERFORMANCE_MONITORING=false      # Real User Monitoring
VITE_ENABLE_DELETION_AUDIT=true               # Log cascade operations
VITE_SENTRY_DSN=                              # Error tracking (empty = disabled)
VITE_ANALYTICS_ENABLED=false                  # Analytics collection
```

**WebSocket & Cascade Deletion:**
```
VITE_WEBSOCKET_DELETION_CHANNEL=cascade-operations   # Socket.IO namespace
VITE_DELETION_BATCH_LIMIT=10                         # Items per batch delete
VITE_DELETION_TIMEOUT_MS=30000                       # Operation timeout
VITE_MAX_DELETION_REQUESTS_PER_MINUTE=10             # Rate limiting
VITE_ENABLE_DELETION_RATE_LIMITING=true              # Enforce rate limit
```

**Secrets Location:**
- Backend: `.env` file (NOT committed, listed in `.gitignore`)
- Frontend: `.env` file (NOT committed, listed in `.gitignore`)
- CI/CD: GitHub Secrets (platform-specific, not in repo)
- Never commit: `.env`, credentials, API keys, tokens

## Webhooks & Callbacks

**Incoming Webhooks:**
- Not currently implemented

**Outgoing Webhooks:**
- Not currently implemented

**Server-Sent Events (SSE):**
- Not used (WebSocket used instead)

**Export Endpoints (Planned, not yet on backend):**
- `POST /api/export/status` - Get export job status
- `POST /api/export/validate` - Validate export parameters
- `GET /api/export/download` - Download completed export
- Note: Export functionality is planned but endpoint stubs don't exist on backend yet

## API Client Architecture

**File:** `src/services/apiService.js` (5350 lines, single source of truth)

**HTTP Client Features:**
- Fetch API (not axios)
- Request/response interception via `ApiClient` class
- Automatic retry on transient failures (not 401/403)
- Request deduplication (prevents double-submission)
- Timeout: 30 seconds per request
- Content-Type auto-detection (JSON and text)

**Authentication Integration:**
- Bearer token in every request (if authenticated)
- Token refresh on 401 for eligible endpoints
- Token removal on critical endpoint 401 failures
- Separate login endpoint behavior (returns backend-specific error messages)

**Error Handling Patterns:**
```javascript
// Validation errors with field-level details
if (response.status === 400 && data?.code === 'VALIDATION_ERROR') {
  error.code = 'VALIDATION_ERROR'
  error.validationErrors = data.validationErrors  // { fieldName: [errors] }
}

// Auth-specific handling
if (response.status === 401) {
  // For auth endpoints: pass through backend message
  // For data endpoints: keep token, might be temporary
}

// Attendance lookups return null on 404 (not error)
if (response.status === 404 && endpoint.includes('/attendance/individual')) {
  return null
}
```

---

*Integration audit: 2026-02-17*
