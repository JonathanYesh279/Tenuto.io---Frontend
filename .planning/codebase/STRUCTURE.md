# Codebase Structure

**Analysis Date:** 2026-02-13

## Directory Layout

```
Tenuto.io-Frontend/
├── src/
│   ├── App.tsx                              # Root app component, routing setup
│   ├── index.tsx                            # React app entry point
│   ├── pages/                               # Top-level page components
│   ├── features/                            # Feature modules by domain
│   ├── components/                          # Shared UI & feature components
│   ├── services/                            # API, auth, state management
│   ├── contexts/                            # React Context providers
│   ├── providers/                           # Provider wrappers (QueryProvider)
│   ├── utils/                               # Reusable utilities & helpers
│   ├── constants/                           # Constants & enums
│   ├── types/                               # TypeScript type definitions
│   ├── hooks/                               # Custom React hooks
│   └── styles/                              # Global CSS (if any)
├── public/                                  # Static assets
├── .github/workflows/                       # CI/CD pipeline
├── .planning/codebase/                      # GSD planning documents
└── package.json                             # Dependencies & scripts
```

## Directory Purposes

**src/App.tsx:**
- Purpose: Root React component with routing setup
- Contains: AppRoutes component definition, ProtectedRoute component, lazy page imports
- Key exports: App (default), AppRoutes, ProtectedRoute, PageLoadingFallback

**src/pages/:**
- Purpose: Top-level page components for main routes
- Contains: One `.tsx` file per page (Dashboard, Students, Teachers, Orchestras, Rehearsals, Bagruts, Profile, etc.)
- Key files:
  - `Dashboard.tsx`: Overview page with stats, charts, hours summary
  - `Students.tsx`: Student list with search, filters, pagination
  - `Teachers.tsx`: Teacher list
  - `Orchestras.tsx`: Orchestra list
  - `Settings.tsx`: Admin-only settings page
  - `MinistryReports.tsx`: Admin-only ministry reporting
  - `ImportData.tsx`: Admin-only data import
  - `Login.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`: Auth pages

**src/features/[entity]/details/:**
- Purpose: Feature modules for entity detail pages with tab-based interface
- Contains:
  - `components/`: Main detail page + tab components + supporting modals/components
  - `types/`: TypeScript interfaces for that entity
  - `hooks/`: Custom hooks for entity-specific logic
- Entities:
  - `src/features/students/details/` - Student detail page with 7 tabs
  - `src/features/teachers/details/` - Teacher detail page with 7 tabs
  - `src/features/orchestras/details/` - Orchestra detail page with 3 tabs

**src/features/[entity]/details/components/:**
- Purpose: Render entity detail page and its tabs
- Contains:
  - `[Entity]DetailsPage.tsx`: Master component managing routing + state
  - `[Entity]TabNavigation.tsx`: Renders tab buttons
  - `[Entity]TabContent.tsx`: Renders active tab content via switch/case
  - `tabs/[TabName].tsx`: Individual tab components (PersonalInfoTab, AcademicInfoTab, etc.)
  - Modals and supporting components for that entity

**src/features/students/details/:**
- Key files:
  - `StudentDetailsPageSimple.tsx`: Entry point for route `/students/:studentId`
  - `StudentTabNavigation.tsx`: Tab buttons (Personal, Academic, Schedule, Attendance, Orchestra, Theory, Documents)
  - `StudentTabContent.tsx`: Router for active tab
  - `tabs/PersonalInfoTabSimple.tsx`: Name, email, phone, DOB
  - `tabs/AcademicInfoTabSimple.tsx`: Class, instrument, stage
  - `tabs/ScheduleTab.tsx`: Lesson schedule
  - `tabs/AttendanceTab.tsx`: Attendance records
  - `tabs/OrchestraTab.tsx`: Orchestra enrollments
  - `tabs/TheoryTab.tsx`: Theory lesson participation
  - `tabs/DocumentsTab.tsx`: Student documents
  - `modals/`: Quick actions, stage advancement confirmation
  - `hooks/usePermissionsAndAudit.tsx`: Permission & audit trail logic
  - `types/index.ts`: Student-specific TypeScript interfaces

**src/features/teachers/details/:**
- Key files:
  - `TeacherDetailsPage.tsx`: Entry point for route `/teachers/:teacherId`
  - `TeacherTabNavigation.tsx`: Tab buttons (Overview, Personal, Conducting, Schedule, Student Management, Hours Summary)
  - `TeacherTabContent.tsx`: Router for active tab
  - `tabs/TeacherOverviewTab.tsx`: Summary of teacher info
  - `tabs/PersonalInfoTab.tsx`: Name, email, phone, credentials
  - `tabs/ConductingTab.tsx`: Orchestras conducting
  - `tabs/ScheduleTab.tsx`: Teaching schedule
  - `tabs/StudentManagementTab.tsx`: Students taught (with enrollment)
  - `tabs/HoursSummaryTab.tsx`: Weekly hours breakdown
  - `hooks/`: Teacher-specific logic hooks
  - `types/`: Teacher TypeScript interfaces

**src/features/orchestras/details/:**
- Key files:
  - `OrchestraDetailsPage.tsx`: Entry point for route `/orchestras/:orchestraId`
  - `OrchestraTabNavigation.tsx`: Tab buttons (Personal, Schedule, Members)
  - `OrchestraTabContent.tsx`: Router for active tab
  - `tabs/PersonalInfoTab.tsx`: Orchestra name, conductor, rehearsal info
  - `tabs/ScheduleTab.tsx`: Rehearsal schedule
  - `tabs/MembersTab.tsx`: Orchestra members
  - `types/`: Orchestra TypeScript interfaces

**src/components/:**
- Purpose: Reusable UI components, feature components, and domain-specific components
- Subdirectories (by domain/feature):
  - `ui/`: Basic UI components (Card, Button, Input, Modal, Table, Calendar, Pagination, Alert, Badge, etc.)
  - `forms/`: Form components (StudentForm)
  - `form/`: Form-related helpers
  - `dashboard/`: Dashboard-specific components (ConductorDashboard, TeacherDashboard, charts)
  - `dashboard/charts/`: Chart components for dashboard
  - `navigation/`: Navigation components (Sidebar, Header, MenuItems)
  - `modals/`: Modal dialogs
  - `attendance/`: Attendance tracking components
  - `enrollment/`: Orchestra enrollment components
  - `rehearsal/`: Rehearsal-related components
  - `schedule/`: Schedule/calendar components
  - `bagrut/`: Bagrut (graduation exam) components
  - `bagrut/chunks/`: Bagrut sub-components
  - `profile/`: User profile components
  - `teacher/`: Teacher-specific components
  - `theory/`: Theory lesson components
  - `search/`: Search/filter components
  - `deletion/`: Cascade deletion safety components
  - `security/`: Security-related components
  - `analytics/`: Analytics components
  - `accessibility/`: Accessibility helpers
  - `feedback/`: User feedback components
  - `charts/`: General chart components

**src/services/:**
- Purpose: API communication, authentication, and specialized business logic
- Key files:
  - `apiService.js`: Main HTTP client (~4800 lines) with grouped endpoints
    - `auth.*`: Login, logout, password reset, tenant selection
    - `students.*`: CRUD operations for students
    - `teachers.*`: CRUD operations for teachers
    - `orchestras.*`: CRUD operations for orchestras
    - `rehearsals.*`: Rehearsal operations
    - `theory.*`: Theory lesson operations
    - `bagrut.*`: Bagrut management
    - `schedules.*`: Schedule operations
  - `authContext.jsx`: Auth state management with debounced validation
  - `schoolYearContext.jsx`: School year selection state
  - `bagrutService.js`: Bagrut-specific operations
  - `bagrutValidationService.ts`: Bagrut validation logic
  - `cascadeDeletionService.js`: Cascade deletion orchestration
  - `cascadeDeletionService.ts`: Cascade deletion state management
  - `orchestraEnrollmentApi.ts`: Orchestra enrollment operations
  - `teacherDetailsApi.ts`: Teacher detail operations
  - `studentDetailsApi.ts`: Student detail operations
  - `theoryEnrollmentService.js`: Theory enrollment operations
  - `analyticsService.ts`: Analytics utilities
  - `permissionsService.ts`: Role-based permission checks
  - `securityService.ts`: Security utilities
  - `errorHandler.ts`: Error handling utilities
  - `errorTrackingService.ts`: Error tracking & reporting
  - `healthCheckService.ts`: API health checks
  - `websocketService.ts`: WebSocket communication (if applicable)

**src/contexts/:**
- Purpose: React Context providers for global state
- Contains:
  - `BagrutContext.tsx`: Bagrut state management with reducer pattern
  - `SidebarContext.tsx`: Sidebar visibility state
  - `DeletionSecurityContext.tsx`: Cascade deletion safety state

**src/providers/:**
- Purpose: Provider wrapper components for app-level setup
- Contains:
  - `QueryProvider.tsx`: React Query configuration with cache settings
  - `BagrutStateProvider.tsx`: Bagrut provider wrapper (if separate from context)

**src/utils/:**
- Purpose: Reusable utility functions
- Contains:
  - `nameUtils.ts`: Name formatting (getDisplayName, getInitials)
  - `validationUtils.ts`: Form validation rules, constants, error messages
  - `dateUtils.ts`: Date formatting and manipulation
  - `bagrutUtils.js`: Bagrut-specific utilities
  - `bagrutMigration.ts`: Data migration for bagrut schema changes
  - `orchestraUtils.ts`: Orchestra-specific utilities
  - `rehearsalUtils.ts`: Rehearsal-specific utilities
  - `theoryLessonUtils.ts`: Theory lesson utilities
  - `scheduleConflicts.ts`: Schedule conflict detection
  - `errorHandling.ts`: Error handling utilities
  - `errorRecovery.ts`: Error recovery logic
  - `cascadeErrorHandler.ts`: Cascade deletion error handling
  - `securityErrorHandler.ts`: Security-related error handling
  - `authUtils.ts`: Auth utility functions
  - `authTestUtils.js`: Auth testing utilities
  - `bundleOptimization.ts`: Code splitting and lazy loading optimization
  - `lazyImports.tsx`: Lazy import helpers
  - `performanceEnhancements.tsx`: Performance optimization utilities
  - `memoryManager.ts`: Memory management utilities
  - `styleUtils.ts`: CSS/Tailwind utilities
  - `securityUtils.ts`: Security utility functions
  - `testStatusUtils.ts`: Test status mapping utilities
  - `presentationMapping.ts`: Bagrut presentation data mapping

**src/constants/:**
- Purpose: Application constants and enums
- Contains:
  - `enums.ts`: Enum definitions (roles, test statuses, etc.)
  - `locations.ts`: Location/venue constants

**src/types/:**
- Purpose: TypeScript type definitions for shared use
- Contains:
  - `bagrut.types.ts`: Bagrut-related interfaces
  - `teacher.types.ts`: Teacher-related interfaces
  - `cascade-deletion.types.ts`: Cascade deletion type definitions

**src/hooks/:**
- Purpose: Custom React hooks for reusable logic
- Contains: General-purpose hooks (not entity-specific)

**public/:**
- Purpose: Static assets served directly
- Contains:
  - `fonts/`: Custom Hebrew fonts (Reisinger-Yonatan, Reisinger-Neta, Reisinger-Michal)

**.github/workflows/:**
- Purpose: CI/CD pipeline configuration
- Contains:
  - `ci.yml`: Build, typecheck, lint, test, deploy stages

## Key File Locations

**Entry Points:**
- `src/index.tsx`: React app bootstrap (imports App.tsx)
- `src/App.tsx`: Root component with providers and routing

**Configuration:**
- `package.json`: Dependencies, scripts, build config
- `tsconfig.json`: TypeScript configuration
- `vite.config.ts`: Vite build configuration
- `.env` (git-ignored): Environment variables (VITE_API_URL, etc.)

**Core Logic:**
- `src/services/apiService.js`: All HTTP communication (~4800 lines)
- `src/services/authContext.jsx`: Auth state management
- `src/utils/validationUtils.ts`: Validation constants & rules
- `src/utils/nameUtils.ts`: Name display formatting

**Testing:**
- `tests/e2e/`: End-to-end tests (Playwright or similar)
- `.spec.ts`, `.test.ts` files: Unit tests (co-located with source)

## Naming Conventions

**Files:**
- Component files: PascalCase (StudentDetailsPageSimple.tsx, PersonalInfoTab.tsx)
- Service/utility files: camelCase (apiService.js, validationUtils.ts)
- Type files: kebab-case with .types.ts suffix (bagrut.types.ts, teacher.types.ts)
- Test files: same name with .test.ts or .spec.ts suffix

**Directories:**
- Feature modules: kebab-case (students, teachers, orchestras)
- Component categories: kebab-case (ui, forms, dashboard, navigation)
- Logical groupings: camelCase or kebab-case consistently (e.g., `tabs/`, `modals/`, `hooks/`)

**Exports:**
- Named exports for utilities (validationUtils.VALID_INSTRUMENTS)
- Default export for pages and main components
- Barrel exports in `index.ts` where multiple related exports exist

**Functions:**
- camelCase for all functions (getDisplayName, validateField, fetchStudents)
- Prefix with action verb (get, set, update, delete, create, validate, etc.)

**Variables:**
- camelCase for all variables
- Boolean variables prefixed with `is`, `has`, `can` (isLoading, hasError, canDelete)
- State variables use useState hook with setter convention: `[state, setState]`

**Types:**
- PascalCase for interfaces and types (StudentDetailsProps, BagrutState, ApiResponse)
- Suffix with specific suffix if clear: Props (ComponentProps), State (ContextState), Result (ValidationResult)
- Enum-like objects use UPPER_CASE (VALID_INSTRUMENTS, VALID_DURATIONS)

## Where to Add New Code

**New Feature (e.g., add new entity type):**
- Create new directory: `src/features/[entity]/details/`
- Add detail page: `src/features/[entity]/details/components/[Entity]DetailsPage.tsx`
- Add tabs: `src/features/[entity]/details/components/tabs/[TabName].tsx`
- Add types: `src/features/[entity]/details/types/index.ts`
- Add API methods: Extend `src/services/apiService.js` with new endpoint group
- Add routes: Update `src/App.tsx` AppRoutes component

**New Page (non-detail page, e.g., Reports):**
- Create: `src/pages/ReportsPage.tsx`
- Add route to AppRoutes in `src/App.tsx`
- Use ProtectedRoute wrapper if requires authentication
- Add role check in allowedRoles prop if restricted

**New Component (shared/reusable):**
- If UI element: `src/components/ui/[ComponentName].tsx`
- If feature-specific: `src/components/[category]/[ComponentName].tsx`
- If form: `src/components/forms/[FormName].tsx`
- Create a `.test.tsx` file alongside for tests

**New Utility:**
- Create in `src/utils/` with descriptive name (e.g., `hoursCalculationUtils.ts`)
- Export named functions, not default export
- Add TypeScript types for parameters and return values

**New API Service:**
- Add method to appropriate group in `src/services/apiService.js`
- Follow existing pattern: `apiService.[entity].[action](params)`
- Include proper error handling and logging

**New Context:**
- Create in `src/contexts/` (or `src/services/` if auth-related)
- Use createContext + custom hook pattern (useContext hook exported)
- Provide reducer pattern if complex state (like BagrutContext)

**New Validation or Constants:**
- Add to `src/utils/validationUtils.ts` if validation-related
- Add to `src/constants/enums.ts` if enum/constant
- Keep validation constants in one place for DRY principle

## Special Directories

**src/features/[entity]/types/:**
- Purpose: TypeScript interfaces and types for that entity
- Generated: No (manually authored)
- Committed: Yes
- Pattern: `index.ts` barrel file exporting all types for that entity
- Import pattern: `import { StudentType, StudentTabConfig } from '../types'`

**src/components/ui/:**
- Purpose: Low-level reusable UI components
- Generated: No
- Committed: Yes
- Pattern: Pure components taking props, no business logic
- Examples: Card, Button, Input, Modal, Table, Calendar
- Styling: Tailwind CSS

**public/fonts/:**
- Purpose: Custom fonts served statically
- Generated: No (third-party fonts)
- Committed: Yes
- Contents: Hebrew font files (woff2, woff formats)
- CSS loaded in index.html or App.tsx

**tests/e2e/:**
- Purpose: End-to-end tests (user workflows)
- Generated: No (manually authored)
- Committed: Yes (except .auth/ directory with session data)
- Pattern: Playwright test files (.spec.ts)
- Auth: Uses .auth/ directory for session reuse across tests

---

*Structure analysis: 2026-02-13*
