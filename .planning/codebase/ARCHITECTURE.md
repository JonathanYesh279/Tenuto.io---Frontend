# Architecture

**Analysis Date:** 2026-02-13

## Pattern Overview

**Overall:** Multi-layer React application using Feature-Based Architecture with Services Layer for API communication.

**Key Characteristics:**
- Feature modules organized by domain (students, teachers, orchestras, rehearsals, bagrut, theory-lessons)
- Centralized API service layer (`src/services/apiService.js` ~4800 lines) handles all HTTP communication
- React Context for global state (auth, school year, bagrut, sidebar)
- React Query for caching and data fetching
- Lazy-loaded pages with code splitting for performance
- RTL-first layout (Hebrew hardcoded, no i18n)
- React Hook Form + Zod for form validation
- Tailwind CSS for styling

## Layers

**Presentation Layer (Pages & Components):**
- Purpose: Render UI and handle user interactions
- Location: `src/pages/`, `src/components/`
- Contains: React components, pages, modals, forms, UI elements
- Depends on: Services layer, utilities, contexts
- Used by: React Router for navigation

**Feature Layer (Domain-Specific Details):**
- Purpose: Encapsulate feature-specific logic for major entities (students, teachers, orchestras)
- Location: `src/features/[entity]/details/` (StudentDetailsPageSimple, TeacherDetailsPage, OrchestraDetailsPage)
- Contains: Tabs, modals, hooks, type definitions specific to each entity
- Depends on: Services layer, components, utilities
- Used by: Pages via React Router

**Services Layer (API & State):**
- Purpose: Handle HTTP communication, authentication, and global state
- Location: `src/services/`
- Contains: apiService.js (main HTTP client), authContext.jsx, schoolYearContext.jsx, specialized services (bagrutService, cascadeDeletionService, etc.)
- Depends on: Utilities, localStorage/sessionStorage for auth tokens
- Used by: All components and pages

**State Management:**
- **React Context:** AuthProvider, SchoolYearProvider, BagrutProvider, SidebarProvider
- **React Query:** Data fetching and caching via QueryProvider (`src/providers/QueryProvider.tsx`)
- **Zustand-like:** Cascade deletion state in DeletionSecurityContext
- **Local state:** useState for component-level state

**Utilities Layer:**
- Purpose: Reusable functions and constants
- Location: `src/utils/`, `src/constants/`
- Contains: nameUtils, validationUtils, dateUtils, errorHandling, bagrutUtils, etc.
- Example: `getDisplayName()` for consistent name display (firstName/lastName with fullName fallback)

## Data Flow

**Authentication Flow:**

1. User navigates to `/login`
2. Login page calls `apiService.auth.login(email, password)`
3. Backend returns JWT token + user object
4. Token stored in localStorage/sessionStorage by apiService
5. AuthProvider checks `apiService.auth.isAuthenticated()` on app mount
6. If authenticated, user object stored in context state
7. ProtectedRoute validates user role before rendering page

**Page/Entity Data Flow:**

1. User navigates to `/students/:studentId`
2. ProtectedRoute checks authentication + role
3. StudentDetailsPageSimple component mounts
4. useParams extracts studentId from URL
5. useEffect triggers `apiService.students.getStudentById(studentId)`
6. Response cached by React Query (staleTime: 2 minutes)
7. setStudent updates component state with response
8. StudentTabNavigation renders tabs, StudentTabContent renders active tab
9. Each tab (PersonalInfoTab, AcademicInfoTab, etc.) receives student prop
10. Child components call apiService methods to update/create related data
11. On success, parent component updates via handleStudentUpdate callback

**State Management:**

- **AuthProvider** maintains isAuthenticated, user, authError, loading state
- **SchoolYearProvider** maintains currentSchoolYear selection
- **BagrutProvider** manages bagrut state with reducer pattern for complex operations
- **QueryProvider** caches all API responses by key (students, teachers, orchestras, etc.)
- **SidebarProvider** manages sidebar open/closed state for responsive design

## Key Abstractions

**ApiService (src/services/apiService.js):**
- Purpose: Single point of HTTP communication for entire application
- Pattern: Grouped by entity (auth, students, teachers, orchestras, rehearsals, theory, bagrut, etc.)
- Features: Token refresh, request deduplication, error handling, automatic retries
- Example: `apiService.students.getStudents()`, `apiService.students.getStudentById(id)`, `apiService.students.updateStudent(id, data)`

**Feature Detail Pages:**
- Pattern: Each entity (Student, Teacher, Orchestra) has a details page with tabs
- Files: `src/features/[entity]/details/components/[Entity]DetailsPage.tsx`
- Structure: Master page manages state, TabNavigation renders tab buttons, TabContent delegates to tab components
- Tabs: PersonalInfoTab, AcademicInfoTab, ScheduleTab, AttendanceTab, OrchestraTab, TheoryTab, etc.

**Tab Components:**
- Location: `src/features/[entity]/details/components/tabs/[TabName].tsx`
- Pattern: Each tab is a self-contained component that receives entity data as prop
- Responsibility: Display data for that tab, handle form submissions, call apiService for updates
- Example: `PersonalInfoTab.tsx` shows name, email, phone; submits via `apiService.students.updateStudent()`

**Contexts:**
- **AuthContext** (`src/services/authContext.jsx`): Authentication state with debounced validation
- **SchoolYearContext** (`src/services/schoolYearContext.jsx`): Selected school year for filtering
- **BagrutContext** (`src/contexts/BagrutContext.tsx`): Complex bagrut state with reducer
- **SidebarContext** (`src/contexts/SidebarContext.tsx`): Sidebar visibility state
- **DeletionSecurityContext** (`src/contexts/DeletionSecurityContext.tsx`): Cascade deletion state

**Validation & Constants:**
- Location: `src/utils/validationUtils.ts`, `src/constants/`
- Purpose: Centralized validation rules, error messages, and enum values
- Used by: Forms, field validation, dropdown options
- Example: VALID_INSTRUMENTS (27 instruments), VALID_DURATIONS ([30, 45, 60]), VALID_DAYS, VALID_CLASSES

**Name Utilities:**
- Location: `src/utils/nameUtils.ts`
- Pattern: All components use `getDisplayName(personalInfo)` to show name (handles both firstName/lastName and legacy fullName)
- Backward compatibility: fullName fallback if firstName/lastName not present

## Entry Points

**App Root:**
- Location: `src/App.tsx`
- Triggers: Application bootstrap
- Responsibilities:
  - Set up context providers (Auth, SchoolYear, Bagrut, Sidebar, QueryProvider)
  - Configure React Hot Toast for notifications
  - Initialize bundle optimizations
  - Render AppRoutes component

**AppRoutes:**
- Location: Inside App.tsx (function AppRoutes())
- Triggers: Renders routing structure
- Responsibilities:
  - Define all protected routes with ProtectedRoute wrapper
  - Apply role-based access control (allowedRoles prop)
  - Lazy load pages with Suspense fallbacks
  - RTL layout wrapper (dir="rtl")

**ProtectedRoute:**
- Location: Inside App.tsx (component ProtectedRoute)
- Triggers: Every protected route passes through this component
- Responsibilities:
  - Check isAuthenticated status from AuthContext
  - Verify user has required role(s) if allowedRoles specified
  - Auto-retry authentication with exponential backoff on auth errors
  - Redirect to /login if not authenticated
  - Show "No permission" if role doesn't match

**Pages:**
- Location: `src/pages/[PageName].tsx`
- Examples: Dashboard, Students, Teachers, Orchestras, Rehearsals, Bagruts, Profile, Settings, MinistryReports, ImportData
- Triggers: React Router navigation
- Responsibilities: Fetch data, render page layout, delegate to components

**Detail Pages:**
- Location: `src/features/[entity]/details/components/[Entity]DetailsPageSimple.tsx`
- Examples: StudentDetailsPageSimple, TeacherDetailsPage, OrchestraDetailsPage
- Triggers: React Router with :id param (`/students/:studentId`)
- Responsibilities: Fetch entity by ID, manage active tab state, pass data to tab components

## Error Handling

**Strategy:** Multi-layered error handling with user-friendly messages and automatic recovery.

**Patterns:**

1. **API Error Handling (apiService.js):**
   - 401 Unauthorized: Clear auth tokens, redirect to login
   - 4xx Client errors: Show user-friendly message from backend
   - 5xx Server errors: Retry with exponential backoff (up to 2 times)
   - Network errors: Fallback message "Failed to connect"

2. **Auth Error Handling (AuthContext):**
   - On auth check failure: Retry up to 2 times with exponential backoff (1s, 2s)
   - On persistent failure: Clear tokens, set authError state
   - UI shows retry count to user if multiple attempts fail

3. **Component Error Handling:**
   - Try-catch in useEffect for data fetching
   - Set error state, render error UI with retry button
   - StudentDetailsErrorBoundary wraps complex pages for React error boundaries

4. **Form Error Handling:**
   - React Hook Form validation on submit
   - Zod schema validation for type safety
   - Field-level error messages shown below inputs
   - Toast notifications for submission success/failure

## Cross-Cutting Concerns

**Logging:**
- Console logs with emoji prefixes for debugging (🔐 auth, 🌐 API, 🔄 updates, etc.)
- Development logs in browser console only, no external logging service

**Validation:**
- Centralized in `src/utils/validationUtils.ts`
- Used by forms (React Hook Form + Zod) and API calls
- Hebrew error messages for user display
- Backend-compatible enums (VALID_INSTRUMENTS, VALID_DURATIONS, VALID_CLASSES)

**Authentication:**
- Token-based (JWT in localStorage)
- Multi-login support (regular admin + super admin in separate context)
- Role-based access control (menhel, mora, mentzel, mora_teooria)
- Tenant selection flow for super admin
- AuthProvider validates on app load with caching

**Bundle Optimization:**
- Lazy loading pages with `lazyWithRetry()` in App.tsx
- Code splitting via React.lazy()
- Retry mechanism for lazy load failures
- Bundle analysis in build process

**RTL Layout:**
- Tailwind RTL utilities throughout
- dir="rtl" on root div in App and throughout
- Hebrew hardcoded (no i18n library)
- Responsive with mobile breakpoints

---

*Architecture analysis: 2026-02-13*
