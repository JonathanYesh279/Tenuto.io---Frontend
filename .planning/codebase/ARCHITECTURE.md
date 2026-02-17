# Architecture

**Analysis Date:** 2026-02-17

## Pattern Overview

**Overall:** Modular React SPA with layered architecture combining Context-based state management, React Query for server state, and Zustand for cascade deletion state.

**Key Characteristics:**
- RTL-first Hebrew application (no i18n library, hardcoded Hebrew)
- Multi-tenant architecture with school-year and bagrut context
- Feature-module driven for major entities (Teachers, Students, Orchestras)
- Centralized HTTP abstraction layer via `apiService.js` (~5350 lines)
- Protected routes with role-based access control
- Progressive loading with lazy component hydration
- Comprehensive cascade deletion tracking with Zustand state

## Layers

**Presentation (UI Components):**
- Purpose: Render interface and handle user interaction
- Location: `src/components/`
- Contains: Reusable UI primitives (`ui/`), feature-specific components (attendance, bagrut, dashboard, rehearsal, schedule, etc.), form components, navigation, modals
- Depends on: Services layer (via apiService), Context providers, Hooks
- Used by: Page components

**Page Layer:**
- Purpose: Route handlers that coordinate data loading and component composition
- Location: `src/pages/`
- Contains: 18 page components (Students, Teachers, TheoryLessons, Orchestras, Rehearsals, BagrutDetails, MinistryReports, ImportData, Settings, AuditTrail, Dashboard, etc.)
- Depends on: Services, Context providers, Components
- Used by: Router (App.tsx)

**Feature Modules:**
- Purpose: Encapsulate domain logic for major entities with tabs pattern
- Location: `src/features/[entity]/details/`
- Structure: TeacherDetailsPage, StudentDetailsPageSimple, OrchestraDetailsPage with tabs, types, hooks
- Contains: Tab navigation, tab content components, modals, custom hooks, TypeScript types
- Depends on: apiService, services layer, utils
- Used by: Router, Pages

**Services Layer (Business Logic + HTTP):**
- Purpose: Handle all HTTP communication, data transformation, business logic
- Location: `src/services/`
- Core services:
  - `apiService.js` (5350 lines): SINGLE source of truth for all API calls. Organized as ApiClient with methods grouped by entity (students, teachers, orchestras, rehearsals, theoryLessons, bagruts, etc.). Handles auth token management, request deduplication, retry logic.
  - `authContext.jsx` (450 lines): React Context providing authentication state, token validation, user info, login/logout/register
  - `schoolYearContext.jsx` (212 lines): School year selection context
  - `cascadeDeletionService.js` (585 lines): Manages deletion cascade validation
  - `bagrutService.js` (366 lines): Bagrut-specific business logic
  - `theoryEnrollmentService.js` (602 lines): Theory lesson enrollment
  - Specialized services: `bagrutValidationService.ts`, `orchestraEnrollmentApi.ts`, `dataIntegrityService.ts`, `errorTrackingService.ts`, `securityAuditService.ts`, `healthCheckService.ts`
- Depends on: Fetch API, localStorage
- Used by: Components, Pages, Hooks

**State Management Layer:**
- Context Providers:
  - `AuthProvider` (`authContext.jsx`): Async auth state, token refresh, user identity
  - `SchoolYearProvider` (`schoolYearContext.jsx`): Current school year selection
  - `BagrutProvider` (`BagrutContext.tsx`): Bagrut tracking and validation
  - `SidebarContext` (`SidebarContext.tsx`): UI sidebar open/close state
  - `DeletionSecurityContext` (`DeletionSecurityContext.tsx`): Cascade deletion security states
  - `QueryProvider` (`QueryProvider.tsx`): React Query client with cache invalidation
- Zustand Store:
  - `cascadeDeletionStore.ts`: Tracks deletion state, preview, execution, rollback
- Server State:
  - React Query manages all entity data (students, teachers, orchestras, etc.)

**Utils & Helpers:**
- Purpose: Cross-cutting utility functions
- Location: `src/utils/`
- Key files:
  - `nameUtils.ts`: getDisplayName(), getInitials(), getSortableName() — handles fullName → firstName/lastName backward compatibility
  - `validationUtils.ts`: Validation constants (27 instruments, classes, durations, roles, test statuses) and patterns (phone, email, time, Hebrew text)
  - `bagrutUtils.js`: Bagrut-specific calculations
  - `errorHandling.ts`: Error severity/category enums, retry config, ErrorContext
  - `dateUtils.ts`: Date parsing and formatting
  - `orchestraUtils.ts`: Orchestra data transformations
  - `rehearsalUtils.ts`: Rehearsal schedule and conflict detection
  - `theoryLessonUtils.ts`: Theory lesson aggregations
  - `scheduleConflicts.ts`: Schedule validation
  - `securityUtils.ts`: Authorization helpers
  - `bundleOptimization.ts`: lazyWithRetry() for code-splitting
  - `errorRecovery.ts`, `cascadeErrorHandler.ts`: Recovery strategies

**Hooks (Custom Hooks):**
- Purpose: Encapsulate stateful logic and reusable component patterns
- Location: `src/hooks/`
- Key hooks:
  - `useCascadeDeletion.ts`: Deletion preview/execution with Zustand store
  - `useBagrut.ts`: Bagrut context wrapper
  - `useTeacherData.ts`: Teacher data fetching
  - `useStudentDeletion.ts`: Student-specific deletion logic
  - `useOptimizedQuery.ts`: React Query wrapper with caching
  - `usePerformanceMonitoring.ts`: Performance tracking
  - `useProgressiveSave.ts`: Auto-save form changes
  - `useBatchProcessing.ts`: Bulk operations
  - `useAuthRecovery.js`: Auth recovery on failures

**Types & Interfaces:**
- Purpose: TypeScript type definitions
- Location: `src/types/` and feature-specific `*/types/` directories
- Key files:
  - `cascade-deletion.types.ts`: CascadeDeletionError, DataIntegrityError, AuditTrailError
  - `bagrut.types.ts`: Bagrut state interfaces
  - Feature types: `src/features/*/details/types/` (TeacherTabType, TabType, TabConfig)

**Validation & Constants:**
- Purpose: Centralized validation rules and domain constants
- Location: `src/utils/validationUtils.ts` and `src/constants/`
- Defines:
  - VALID_CLASSES: ['א', 'ב', ..., 'יב', 'אחר']
  - VALID_INSTRUMENTS: 27-instrument list with department grouping
  - VALID_DURATIONS: [30, 45, 60] (minutes only)
  - VALID_ROLES: ['מורה', 'מנצח', 'מדריך הרכב', 'מנהל', 'מורה תאוריה', 'מגמה']
  - TEST_STATUSES: 5 status values
  - VALIDATION_PATTERNS: phone, email, time, Hebrew text regex

## Data Flow

**Page Load + Authentication Flow:**

1. `main.tsx` renders App wrapped in QueryProvider, BrowserRouter, AuthProvider
2. `App.tsx` calls `useAuth()` to check stored token via `checkAuthStatus()`
3. `authContext.jsx` hits `GET /auth/verify` to validate token
4. If valid: `setIsAuthenticated(true)`, user state populated
5. If invalid: stored token cleared, user redirected to Login page
6. `ProtectedRoute` component in App.tsx gates all routes, shows 404 on role mismatch

**Entity Data Fetching (e.g., Students page):**

1. `Students.tsx` page mounts
2. Calls `apiService.students.getStudents()` → `GET /students` with query params
3. Response cached by React Query with 2-minute staleTime
4. Components subscribe to cache via direct service calls (not currently using useQuery hook)
5. On update: service calls mutation endpoint, cache invalidated manually via setState, refetch triggered
6. Error boundary catches failed fetches, shows retry UI

**Form Update Flow (e.g., Student edit):**

1. User edits StudentForm (uncontrolled inputs via React Hook Form)
2. Submit calls `apiService.students.updateStudent(id, data)` → `PUT /students/:id`
3. Request deduplication via `pendingRequests.Map` prevents double-submit
4. On success: refresh student cache, navigate to details page
5. On validation error: server returns 400 with field-level errors
6. `handleServerValidationError()` formats errors, shows in form UI
7. On auth error (401): token refresh attempted, request retried

**Tab Navigation in Details Pages:**

1. Route: `/students/:studentId` → StudentDetailsPage
2. Fetch student by ID: `apiService.students.getStudentById(studentId)`
3. Render StudentTabNavigation (tab buttons), StudentTabContent (active tab)
4. Tab content components import from `tabs/` subdir (PersonalInfoTab, AcademicTab, ScheduleTab, etc.)
5. Each tab manages own state (loading, error, edit mode)
6. Updates go back through apiService, state updated, tab re-renders

**Cascade Deletion Flow:**

1. User clicks delete button
2. `useCascadeDeletion()` hook calls `cascadeDeletionService.previewDeletion(entityId)`
3. Service returns list of dependent records (e.g., student → enrollments, lessons, tests)
4. Modal displays impact summary
5. User confirms → `executeDeletion()` calls `DELETE /students/:id` with cascade flag
6. Backend deletes all cascaded records
7. Frontend Zustand store updated with deletion state
8. Page refetches/redirects

**State Management Decision Tree:**

```
Is it auth state?           → AuthContext
Is it school year?          → SchoolYearContext
Is it UI sidebar state?     → SidebarContext
Is it bagrut tracking?      → BagrutContext
Is it deletion tracking?    → Zustand cascadeDeletionStore
Is it server data?          → React Query (apiService + cache)
Is it form state?           → React Hook Form (uncontrolled)
```

## Key Abstractions

**ApiClient:**
- Purpose: HTTP communication with auth and retry
- Examples: `src/services/apiService.js`
- Pattern: Single instance with methods grouped by entity
- Methods: GET, POST, PUT, DELETE with automatic Bearer token injection
- Retry: Exponential backoff on 5xx errors, skip on 4xx
- Deduplication: `pendingRequests` Map prevents duplicate in-flight requests

**Protected Route:**
- Purpose: Enforce authentication + role-based access
- Examples: `src/App.tsx` ProtectedRoute component
- Pattern: Higher-order component wrapping page layouts
- Checks: `isAuthenticated` flag, role validation against `allowedRoles` array
- Fallbacks: Shows spinner during auth check, redirects to login if unauthenticated, shows 403 if unauthorized

**Detail Page Pattern:**
- Purpose: Reusable multi-tab interface for entity details
- Examples: `src/features/[entity]/details/components/[Entity]DetailsPage.tsx`
- Structure:
  - Page component: Fetch data by ID, handle loading/error, manage active tab state
  - Tab Navigation: Button list for tab switching
  - Tab Content: Conditional render based on activeTab
  - Tab Components: Individual feature tabs imported from `tabs/` subdirectory
- Props: `{ [entity]: Object, onUpdate: (updated) => void }`

**Form Validation:**
- Purpose: Client-side validation before submit
- Framework: React Hook Form + Zod (NOT Formik)
- Pattern: Controlled via `useForm({ resolver: zodResolver(schema) })`
- Hebrew messages: ERROR_MESSAGES dict in validationUtils.ts
- Server validation: Form resubmits after fixing server errors

**Modal Pattern:**
- Purpose: Overlaid interactive dialogs
- Location: `src/components/ui/` and feature-specific `modals/`
- Examples: ConfirmDeleteModal, ConfirmationModal, InputModal, QuickActionsModal
- State: Modal open/close managed in parent page, passed as prop
- Behavior: Escape key and backdrop click dismiss, confirm/cancel buttons for actions

**Lazy Loading Pattern:**
- Purpose: Code-split pages for faster initial load
- Implementation: `lazyWithRetry()` in `src/utils/bundleOptimization.ts`
- Usage: `const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'), 'Dashboard')`
- Fallback: PageLoadingFallback spinner shown during chunk load

## Entry Points

**main.tsx:**
- Location: `src/main.tsx`
- Triggers: Browser startup
- Responsibilities: Set up React root, wrap App in providers (QueryClientProvider, BrowserRouter), enable Immer MapSet for Zustand

**App.tsx:**
- Location: `src/App.tsx`
- Triggers: Router initialization
- Responsibilities: Define all routes, lazy-load page components, setup ProtectedRoute wrappers, initialize bundle optimizations, render Toaster for notifications

**Layout.tsx:**
- Location: `src/components/Layout.tsx`
- Triggers: Wrapped by ProtectedRoute in App.tsx
- Responsibilities: Render Sidebar (if user has role), Header, main content area with margin adjustments, RTL direction

**Sidebar.tsx:**
- Location: `src/components/navigation/Sidebar.tsx`
- Triggers: Rendered by Layout if user authenticated
- Responsibilities: Navigation menu with links to all pages, role-based visibility, responsive mobile collapse

**authContext.jsx:**
- Location: `src/services/authContext.jsx`
- Triggers: App wraps entire tree in AuthProvider
- Responsibilities: Check stored token on mount, validate token with backend, manage login/logout, provide user object to all children

## Error Handling

**Strategy:** Multi-layered error catching with retry, fallback, and user notification

**Patterns:**

1. **Network Error Retry:**
   - `apiService.js` catches fetch failures
   - Exponential backoff: 1s, 2s, 4s, ... up to 30s
   - Retries 3x for 5xx errors, skips 4xx
   - Returns null on final failure

2. **Auth Error Recovery:**
   - 401 response triggers token refresh attempt
   - If refresh fails: clear token, redirect to login
   - ProtectedRoute retries auth check up to 2x with 1s delay
   - If still fails: show "Authentication failed" message

3. **Validation Error Display:**
   - Server returns 400 with field-level errors
   - `handleServerValidationError()` formats error object
   - Form re-renders with red error text under each field
   - User can retry submit after fix

4. **Component Error Boundary:**
   - `StudentDetailsErrorBoundary.tsx` catches render errors in student details
   - Falls back to "Error loading page" message with reload button
   - Prevents entire app crash from single component failure

5. **User Notification:**
   - `react-hot-toast` Toaster shows success/error messages
   - Success: "תלמיד שמור בהצלחה" (green toast)
   - Error: "שגיאה בשמירה: {message}" (red toast)
   - Info: "טוען..." (blue toast)

## Cross-Cutting Concerns

**Logging:**
- Console.log() statements throughout (console-only, no backend log collection yet)
- Prefixed with emojis: 🔐 auth, 🌐 network, ✅ success, ❌ error, 🔄 loading
- Purpose: Development debugging, no PII logged

**Validation:**
- Client-side: React Hook Form + Zod schemas + validationUtils patterns
- Constants centralized in `src/utils/validationUtils.ts` (VALID_INSTRUMENTS, VALID_DURATIONS, etc.)
- Server-side: Backend enforces same rules, returns 400 on mismatch
- Pattern: Try client validation first, show server validation errors on form fields

**Authentication:**
- JWT stored in localStorage (sessionStorage as fallback)
- Sent as `Authorization: Bearer <token>` header on all requests
- Token validation via `GET /auth/verify` on app startup
- Refresh mechanism: On 401, call `POST /auth/refresh` to get new token
- No auto-logout timeout yet (backend determines expiry)

**Authorization:**
- Role-based access control (RBAC) via ProtectedRoute `allowedRoles` prop
- Roles: 'admin', 'teacher', 'conductor', 'theory-teacher', 'ensemble-director'
- Hebrew roles mapped to English in role validation logic
- Per-page permissions: Some pages show different content by role (e.g., MinistryReports admin-only)
- No granular field-level permissions yet

**Performance:**
- Lazy page loading: All pages use `lazyWithRetry()` for code-splitting
- React Query cache: 5min default staleTime, entity-specific overrides (students 2min, teachers 10min, orchestras 5min)
- Request deduplication: `pendingRequests` Map prevents duplicate in-flight requests
- Prefetching: `cacheUtils.prefetch.*` for dashboard data on route anticipation
- Memory: `memoryManager.ts` tracks cache size, can trigger GC

---

*Architecture analysis: 2026-02-17*
