# Codebase Structure

**Analysis Date:** 2026-02-17

## Directory Layout

```
Tenuto.io-Frontend/
├── .claude/                    # Claude Code skill modules
├── .github/workflows/          # CI/CD pipeline (ci.yml)
├── .planning/                  # GSD project artifacts (phase plans, STATE.md, MEMORY.md)
├── public/                     # Static assets (fonts, favicon)
├── src/                        # Application source code
│   ├── App.tsx                 # Main router and protected routes
│   ├── main.tsx                # React entry point with providers
│   ├── index.css               # Global styles
│   ├── vite-env.d.ts          # Vite type definitions
│   │
│   ├── pages/                  # Page components (18 total)
│   │   ├── Students.tsx
│   │   ├── Teachers.tsx
│   │   ├── TheoryLessons.tsx
│   │   ├── TheoryLessonDetails.tsx
│   │   ├── Orchestras.tsx
│   │   ├── Rehearsals.tsx
│   │   ├── RehearsalDetails.tsx
│   │   ├── Bagruts.tsx
│   │   ├── BagrutDetails.tsx
│   │   ├── Dashboard.tsx
│   │   ├── MinistryReports.tsx
│   │   ├── ImportData.tsx
│   │   ├── Settings.tsx
│   │   ├── AuditTrail.tsx
│   │   ├── Profile.tsx
│   │   ├── Login.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   │
│   ├── features/               # Feature modules by entity
│   │   ├── students/
│   │   │   └── details/
│   │   │       ├── components/
│   │   │       │   ├── StudentDetailsPageSimple.tsx
│   │   │       │   ├── StudentTabNavigation.tsx
│   │   │       │   ├── StudentTabContent.tsx
│   │   │       │   ├── StudentDetailsHeader.tsx
│   │   │       │   ├── StudentDetailsErrorBoundary.tsx
│   │   │       │   ├── EnrollmentManager.tsx
│   │   │       │   ├── AuditTrailPanel.tsx
│   │   │       │   ├── DeletionImpactSummary.tsx
│   │   │       │   ├── QuickActionsModal.tsx
│   │   │       │   ├── PermissionWrapper.tsx
│   │   │       │   ├── modals/
│   │   │       │   │   └── StageAdvancementConfirmModal.tsx
│   │   │       │   ├── tabs/
│   │   │       │   │   ├── PersonalInfoTab.tsx
│   │   │       │   │   ├── AcademicTab.tsx
│   │   │       │   │   ├── ScheduleTab.tsx
│   │   │       │   │   ├── AttendanceTab.tsx
│   │   │       │   │   ├── OrchestraTab.tsx
│   │   │       │   │   ├── TheoryTab.tsx
│   │   │       │   │   └── DocumentsTab.tsx
│   │   │       ├── hooks/
│   │   │       │   ├── useStudentDeletion.ts
│   │   │       │   └── useStudentUpdate.ts
│   │   │       ├── types/
│   │   │       │   └── index.ts
│   │   │       └── index.ts
│   │   │
│   │   ├── teachers/
│   │   │   └── details/
│   │   │       ├── components/
│   │   │       │   ├── TeacherDetailsPage.tsx
│   │   │       │   ├── TeacherTabNavigation.tsx
│   │   │       │   ├── TeacherTabContent.tsx
│   │   │       │   ├── tabs/
│   │   │       │   │   ├── PersonalInfoTab.tsx
│   │   │       │   │   ├── ClassesTab.tsx
│   │   │       │   │   ├── ScheduleTab.tsx
│   │   │       │   │   ├── StudentsTab.tsx
│   │   │       │   │   ├── TheoryLessonsTab.tsx
│   │   │       │   │   ├── PaymentTab.tsx
│   │   │       │   │   └── NotesTab.tsx
│   │   │       ├── hooks/
│   │   │       │   └── useTeacherData.ts
│   │   │       ├── types/
│   │   │       │   └── index.ts
│   │   │       └── index.ts
│   │   │
│   │   └── orchestras/
│   │       └── details/
│   │           ├── components/
│   │           │   ├── OrchestraDetailsPage.tsx
│   │           │   ├── OrchestraTabNavigation.tsx
│   │           │   ├── OrchestraTabContent.tsx
│   │           │   ├── tabs/
│   │           │   │   ├── PersonalInfoTab.tsx
│   │           │   │   ├── MembersTab.tsx
│   │           │   │   └── ScheduleTab.tsx
│   │           ├── types/
│   │           │   └── index.ts
│   │           └── index.ts
│   │
│   ├── components/             # Reusable UI components (22 subdirs)
│   │   ├── Layout.tsx          # Main layout with sidebar + header
│   │   ├── Header.tsx          # Top navigation bar
│   │   ├── Sidebar.tsx         # Left sidebar navigation
│   │   ├── StudentCard.tsx     # Student list card component
│   │   │
│   │   ├── ui/                 # Low-level UI primitives
│   │   │   ├── Table.tsx       # Sortable, paginated table
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ConfirmationModal.tsx
│   │   │   ├── ConfirmDeleteModal.tsx
│   │   │   ├── InputModal.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── ValidationIndicator.tsx
│   │   │   ├── DesignSystem.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── progress.tsx
│   │   │
│   │   ├── forms/              # Form components
│   │   │   └── StudentForm.tsx (80KB - large, all student form tabs)
│   │   │
│   │   ├── navigation/         # Navigation components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   │
│   │   ├── attendance/         # Attendance tracking
│   │   ├── bagrut/            # Bagrut-specific components
│   │   ├── dashboard/         # Dashboard widgets and charts
│   │   ├── enrollment/        # Orchestra enrollment
│   │   ├── rehearsal/         # Rehearsal attendance and management
│   │   ├── schedule/          # Schedule/calendar components
│   │   ├── teacher/           # Teacher-specific components
│   │   ├── modals/            # Feature modals
│   │   ├── deletion/          # Deletion UI (SafeDeleteModal, DeletionImpactModal, BatchDeletionModal)
│   │   ├── charts/            # Chart components (Dashboard, Bagrut)
│   │   ├── search/            # Search components
│   │   ├── filters/           # Filter UI
│   │   ├── theory/            # Theory lesson components
│   │   ├── profile/           # User profile components
│   │   ├── accessibility/     # Accessibility helpers
│   │   ├── analytics/         # Analytics tracking
│   │   ├── feedback/          # User feedback components
│   │   ├── security/          # Security-related UI
│   │   └── examples/          # Example components
│   │
│   ├── services/              # Business logic + HTTP layer (40 files)
│   │   ├── apiService.js      # CRITICAL: 5350-line API client (single source of truth)
│   │   ├── authContext.jsx    # Auth state management (Context)
│   │   ├── schoolYearContext.jsx
│   │   ├── cascadeDeletionService.js
│   │   ├── bagrutService.js
│   │   ├── theoryEnrollmentService.js
│   │   ├── bagrutValidationService.ts
│   │   ├── orchestraEnrollmentApi.ts
│   │   ├── studentDetailsApi.ts
│   │   ├── teacherDetailsApi.ts
│   │   ├── dataIntegrityService.ts
│   │   ├── errorTrackingService.ts
│   │   ├── securityAuditService.ts
│   │   ├── healthCheckService.ts
│   │   ├── websocketService.ts
│   │   ├── auditTrailService.ts
│   │   ├── permissionsService.ts
│   │   ├── securityService.ts
│   │   ├── performanceOptimizations.tsx
│   │   ├── analyticsService.ts
│   │   ├── monitoringService.ts
│   │   ├── quickActionsService.ts
│   │   ├── presentationService.ts
│   │   ├── fileHandlingService.ts
│   │   ├── featureFlagService.ts
│   │   ├── cascadeWebSocket.js
│   │   ├── apiCache.ts
│   │   ├── advancedCacheService.ts
│   │   └── [test files]
│   │
│   ├── contexts/              # React Context providers
│   │   ├── BagrutContext.tsx
│   │   ├── DeletionSecurityContext.tsx
│   │   └── SidebarContext.tsx
│   │
│   ├── stores/                # Zustand stores
│   │   └── cascadeDeletionStore.ts
│   │
│   ├── hooks/                 # Custom React hooks (18 files)
│   │   ├── useAuth.ts
│   │   ├── useCascadeDeletion.ts
│   │   ├── useBagrut.ts
│   │   ├── useTeacherData.ts
│   │   ├── useStudentDeletion.ts
│   │   ├── useOptimizedQuery.ts
│   │   ├── usePerformanceMonitoring.ts
│   │   ├── useProgressiveSave.ts
│   │   ├── useBatchProcessing.ts
│   │   ├── useAuthRecovery.js
│   │   ├── useDeletePermissions.ts
│   │   ├── useIntegrityCheck.ts
│   │   ├── useOrphanedCleanup.ts
│   │   ├── useAuditLog.ts
│   │   └── [others]
│   │
│   ├── providers/              # Provider components
│   │   ├── QueryProvider.tsx   # React Query setup
│   │   └── BagrutStateProvider.tsx
│   │
│   ├── utils/                 # Utility functions (24 files)
│   │   ├── nameUtils.ts       # getDisplayName(), getInitials()
│   │   ├── validationUtils.ts # Constants: VALID_INSTRUMENTS, VALID_DURATIONS, etc.
│   │   ├── errorHandling.ts   # ErrorSeverity, ErrorCategory enums
│   │   ├── dateUtils.ts
│   │   ├── orchestraUtils.ts
│   │   ├── rehearsalUtils.ts
│   │   ├── theoryLessonUtils.ts
│   │   ├── scheduleConflicts.ts
│   │   ├── securityUtils.ts
│   │   ├── bundleOptimization.ts # lazyWithRetry()
│   │   ├── errorRecovery.ts
│   │   ├── cascadeErrorHandler.ts
│   │   ├── bagrutUtils.js
│   │   ├── bagrutMigration.ts
│   │   ├── memoryManager.ts
│   │   ├── performanceEnhancements.tsx
│   │   ├── styleUtils.ts
│   │   ├── authUtils.ts
│   │   ├── testStatusUtils.ts
│   │   ├── presentationMapping.ts
│   │   ├── syncTheoryLessonsData.js
│   │   └── [test/migration utilities]
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── cascade-deletion.types.ts
│   │   ├── bagrut.types.ts
│   │   ├── teacher.types.ts
│   │   ├── testTypes.ts
│   │   └── [feature-specific types in features/*/details/types/]
│   │
│   ├── constants/             # Constants (reserved for future use)
│   │
│   ├── styles/                # Global styles
│   │   └── [Tailwind imports]
│   │
│   ├── lib/                   # Library utilities
│   │
│   ├── middleware/            # Middleware functions
│   │   └── bagrutValidationMiddleware.ts
│   │
│   ├── performance/           # Performance monitoring
│   │
│   ├── workers/               # Web Workers
│   │
│   ├── docs/                  # Internal documentation
│   │
│   ├── examples/              # Example implementations
│   │
│   └── scripts/               # Build/automation scripts
│
├── dist/                      # Build output (git-ignored)
├── node_modules/              # Dependencies (git-ignored)
├── .env                       # Local environment (git-ignored)
├── vite.config.ts            # Vite bundler configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── package.json              # Dependencies and scripts
├── package-lock.json         # Dependency lockfile
├── .eslintrc.cjs            # ESLint configuration
├── .prettierrc               # Prettier formatting
├── CLAUDE.md                 # Claude Code instructions for this project
└── README.md                 # Project documentation

```

## Directory Purposes

**src/:**
- Contains entire React application
- Entry point: `main.tsx` → `App.tsx`

**src/pages/:**
- Route handlers for all main views
- Each file is a top-level route component
- Direct access to services and context hooks
- Responsible for data fetching and page layout

**src/features/:**
- Domain-specific modules for core entities
- Pattern: `features/[entity]/details/` contains tabs, types, hooks
- Example: StudentDetailsPageSimple routes to `/students/:studentId`
- Encapsulates domain logic separate from generic pages

**src/components/:**
- 22 subdirectories for different feature areas
- `ui/` contains low-level primitives (Table, Modal, Card, etc.)
- Feature subdirs contain domain-specific components
- Highly reusable, minimal business logic

**src/services/:**
- All HTTP communication through `apiService.js` (SINGLE SOURCE OF TRUTH)
- Context providers for global state (auth, school year, bagrut)
- Domain-specific services (bagrut, cascade deletion, validation)
- NO direct fetch() calls outside this directory

**src/contexts/:**
- React Context providers only (not services)
- Manages UI state (sidebar), domain state (bagrut), security state (deletion)
- Used with `useContext()` hooks

**src/stores/:**
- Zustand store for cascade deletion tracking
- Optional state management layer (not currently used heavily)

**src/hooks/:**
- Custom hooks encapsulating stateful logic
- Wrap context access, service calls, state machines
- Example: `useCascadeDeletion()` wraps Zustand + service calls

**src/providers/:**
- Provider components that wrap App
- React Query setup (`QueryProvider.tsx`)
- Bagrut state setup

**src/utils/:**
- Pure utility functions, no side effects
- `nameUtils.ts`: fullName ↔ firstName/lastName conversions
- `validationUtils.ts`: Constants (VALID_INSTRUMENTS, VALID_DURATIONS)
- `errorHandling.ts`: Error enums and retry config
- Cross-cutting concerns (dateUtils, errorRecovery, etc.)

**src/types/:**
- TypeScript interfaces and type definitions
- Cascading deletion types, Bagrut state types
- Feature-specific types in `features/[entity]/details/types/`

**src/middleware/:**
- Middleware functions (currently only bagrutValidationMiddleware.ts)
- Could expand for request/response interception

**src/constants/:**
- Reserved for constant definitions (currently minimal use)
- Validation constants in `utils/validationUtils.ts` instead

**public/:**
- Static assets served as-is
- Fonts in `/fonts/` subdirectory (Reisinger variants)
- favicon, robots.txt, etc.

**dist/:**
- Generated build output (git-ignored)
- Served by Vite dev server or production server

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React root setup, providers wrapping
- `src/App.tsx`: Router definition, protected routes, lazy-loaded pages
- `src/components/Layout.tsx`: Main layout with Sidebar + Header
- `src/services/authContext.jsx`: Authentication state provider

**Configuration:**
- `vite.config.ts`: Build configuration, dev server
- `tsconfig.json`: TypeScript compiler settings
- `tailwind.config.js`: Tailwind CSS customization
- `package.json`: Dependencies, scripts, metadata
- `.eslintrc.cjs`: Linting rules
- `.prettierrc`: Code formatting
- `CLAUDE.md`: Project instructions for Claude Code

**Core Logic:**
- `src/services/apiService.js`: All API calls (5350 lines, CRITICAL)
- `src/services/authContext.jsx`: Auth state management
- `src/utils/validationUtils.ts`: Validation constants (27 instruments, durations, classes, roles)
- `src/utils/nameUtils.ts`: Display name conversions
- `src/hooks/useCascadeDeletion.ts`: Deletion workflow

**Testing:**
- `src/services/*.test.ts`: Service unit tests
- Test files scattered by feature (not in dedicated `__tests__` dir)

**Data Models:**
- `src/features/[entity]/details/types/`: Entity-specific TypeScript types
- `src/types/cascade-deletion.types.ts`: Deletion cascade types
- `src/types/bagrut.types.ts`: Bagrut domain types

## Naming Conventions

**Files:**
- Pages: PascalCase.tsx (e.g., `Students.tsx`, `TeacherDetailsPage.tsx`)
- Components: PascalCase.tsx (e.g., `StudentCard.tsx`, `ConfirmDeleteModal.tsx`)
- Utilities: camelCase.ts (e.g., `nameUtils.ts`, `errorHandling.ts`)
- Services: camelCase.js/.ts (e.g., `apiService.js`, `bagrutService.js`)
- Contexts: PascalCase with 'Context' suffix (e.g., `AuthContext.tsx`, `BagrutContext.tsx`)
- Stores: camelCase with 'Store' suffix (e.g., `cascadeDeletionStore.ts`)
- Hooks: camelCase with 'use' prefix (e.g., `useCascadeDeletion.ts`, `useTeacherData.ts`)
- Test files: Same name + `.test.ts` or `.spec.ts`

**Directories:**
- Feature modules: lowercase (e.g., `students`, `teachers`, `orchestras`)
- Component categories: lowercase (e.g., `ui`, `forms`, `modals`, `navigation`)
- Subdirectories: snake_case or lowercase plural (e.g., `details`, `components`, `hooks`, `types`, `tabs`)

**Exports:**
- Named exports for utilities and types
- Default export for page components and feature modules
- Barrel files: `index.ts` in feature directories re-export main exports

## Where to Add New Code

**New Feature/Domain Entity:**
1. Create `src/features/[entity]/details/` structure
2. Main component: `[Entity]DetailsPage.tsx`
3. Tab components: `components/tabs/[TabName]Tab.tsx`
4. Types: `types/index.ts` with entity-specific interfaces
5. Hooks: `hooks/use[Entity]*.ts` for state logic
6. Route: Add to `src/App.tsx` lazy-loaded route
7. API methods: Add to `src/services/apiService.js` [entity] object

**New Page:**
1. Create component in `src/pages/[PageName].tsx`
2. Add route to `src/App.tsx` with `lazyWithRetry()`
3. Add navigation link to `src/components/navigation/Sidebar.tsx`
4. If complex: Move tabs logic to `src/features/` module

**New Component:**
1. Shared UI: `src/components/ui/[ComponentName].tsx`
2. Feature-specific: `src/components/[feature]/[ComponentName].tsx`
3. Form component: `src/components/forms/[FormName].tsx`
4. Modal: `src/components/ui/` or `src/features/[entity]/details/components/modals/`

**New Hook:**
1. Custom logic: `src/hooks/use[HookName].ts`
2. Feature-specific: `src/features/[entity]/details/hooks/use[HookName].ts`
3. Export from hook file, not barrel

**New Service/Utility:**
1. HTTP calls: Add methods to `src/services/apiService.js` (do NOT create separate HTTP file)
2. Domain logic: Create `src/services/[domain]Service.ts`
3. Pure utility: Create `src/utils/[utility]Utils.ts`
4. Context provider: Create `src/services/[domain]Context.jsx` (naming convention includes Context)

**New Validation Constant:**
1. Add to `src/utils/validationUtils.ts` exports
2. Follow pattern: `VALID_[THING]` (e.g., `VALID_INSTRUMENTS`, `VALID_DURATIONS`)
3. Use Hebrew labels, validate against exact values
4. Update backend constant definitions if schema changes

**New Type Definition:**
1. Entity-specific: `src/features/[entity]/details/types/index.ts`
2. Cross-cutting: `src/types/[domain].types.ts`
3. Include JSDoc comments explaining usage

## Special Directories

**node_modules/:**
- Generated by npm install
- Git-ignored
- Contains ~800+ dependencies

**dist/:**
- Built output from Vite
- Git-ignored
- Served by production web server

**.github/workflows/:**
- CI/CD pipeline definition (ci.yml)
- Currently has stages: Build → TypeScript → Lint → Tests → Deploy
- Review after each phase to enable new quality gates

**.planning/:**
- GSD project management artifacts
- STATE.md: Current progress tracking
- MEMORY.md: Claude's persistent notes
- phases/: Implementation phase definitions

---

*Structure analysis: 2026-02-17*
