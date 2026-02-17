# Coding Conventions

**Analysis Date:** 2026-02-17

## Naming Patterns

**Files:**
- React components: PascalCase, `.tsx` extension — `StudentDetailsPageSimple.tsx`, `PersonalInfoTab.tsx`
- Hooks: camelCase with `use` prefix — `useCascadeDeletion.ts`, `useBagrut.ts`, `useProgressTracking.ts`
- Services: camelCase with service name — `apiService.js`, `auditTrailService.ts`, `cascadeDeletionService.ts`
- Types/Interfaces: PascalCase — `StudentTypes.ts`, `testTypes.ts`, `DeletionImpact`, `DeletionOperation`
- Constants/Utils: camelCase — `validationUtils.ts`, `nameUtils.ts`, `bundleOptimization.ts`
- Configuration: camelCase or snake_case — `.eslintrc.json`, `tsconfig.json`, `playwright.config.ts`

**Functions:**
- React components and exports: PascalCase — `StudentDetailsPage`, `PersonalInfoTab`
- Regular functions: camelCase — `fetchStudent()`, `handleStudentUpdate()`, `previewDeletion()`
- Private helper functions: camelCase with optional `_` prefix — `_processOrchestraData()`, `processTeacher()`
- Query key builders: camelCase with nested objects — `cascadeDeletionQueryKeys.preview()`, `cascadeDeletionQueryKeys.operations()`

**Variables:**
- State and constants: camelCase — `isLoading`, `studentData`, `activeTab`, `errorMessage`
- Boolean flags: camelCase with `is/has/should` prefix — `isAuthenticated`, `hasTeachingCertificate`, `shouldShowError`
- Event handlers: camelCase with `handle` prefix — `handleStudentUpdate()`, `handleDeleteClick()`, `handleFormSubmit()`
- Callback functions: camelCase with `on` prefix — `onSuccess()`, `onError()`, `onChange()`
- Redux/Zustand store accessors: camelCase — `store.clearPreview()`, `store.updateState()`

**Types:**
- Interfaces: PascalCase, often with `Props` suffix for component props — `ProtectedRouteProps`, `StudentDetailsProps`, `StudentTests`
- Type unions: PascalCase — `TestStatus`, `TestType`, `TabType`
- Enums/Constants: UPPER_SNAKE_CASE for constants groups, descriptive names for values — `VALID_INSTRUMENTS`, `VALID_DAYS`, `TEST_STATUSES` (array of Hebrew strings)
- Generic types: PascalCase single letter (T, K, V) or descriptive — `T extends ValidationRule`

## Code Style

**Formatting:**
- Prettier with default config (3.0.1)
- Command: `npm run format` formats `src/**/*.{ts,tsx,js,jsx,json,css,md}`
- No manual formatting config in codebase (uses Prettier defaults)
- Automatic Tailwind class sorting via `prettier-plugin-tailwindcss`

**Linting:**
- ESLint v8.45.0 configured in `.eslintrc.json`
- Parser: `@typescript-eslint/parser` for TypeScript
- Key rules:
  - `prefer-const: error` — Enforce `const` over `let`
  - `no-var: error` — Forbid `var` keyword
  - `@typescript-eslint/no-unused-vars: error` with `argsIgnorePattern: "^_"` — Allow intentional unused params prefixed with `_`
  - `@typescript-eslint/no-explicit-any: warn` — Warn on `any` type
  - `@typescript-eslint/no-non-null-assertion: warn` — Warn on non-null assertion operator `!`
  - `react-refresh/only-export-components: warn` — Warn if non-component exports in React component files
- Run: `npm run lint` (strict mode, 0 warnings allowed)
- Fix: `npm run lint:fix`

**TypeScript:**
- Strict mode: disabled (`"strict": false` in `tsconfig.json`)
- Linting overrides strictness: `noUnusedLocals: false`, `noUnusedParameters: false`, `noImplicitAny: false`, but ESLint enforces similar rules
- Target: ES2020
- JSX: `react-jsx` (automatic JSX runtime)
- Module resolution: `bundler`
- Path aliases: `@/*` maps to `./src/*`

## Import Organization

**Order:**
1. React and core React libraries — `import React, { Suspense, useEffect } from 'react'`
2. React Router and navigation — `import { Routes, Route, Navigate } from 'react-router-dom'`
3. External libraries (UI, state, forms) — `import { useQuery, useMutation } from '@tanstack/react-query'`, `import { useForm } from 'react-hook-form'`, `import { toast } from 'react-hot-toast'`
4. Icons and UI components — `import { ArrowRight, RefreshCw } from 'lucide-react'`
5. Internal services — `import apiService from '../../services/apiService'`, `import { cascadeDeletionService } from '../../services/cascadeDeletionService'`
6. Internal hooks — `import { useCascadeDeletion } from '../../hooks/useCascadeDeletion'`
7. Internal components and utilities — `import { getDisplayName } from '../../utils/nameUtils'`, `import StudentTabNavigation from './StudentTabNavigation'`
8. Types and constants — `import { TabType, TabConfig } from '../types'`, `import { VALID_INSTRUMENTS } from '../../utils/validationUtils'`

**Path Aliases:**
- All internal paths use explicit relative imports or `@/` alias
- Alias `@/*` resolves to `./src/*` — Use `import { type } from '@/types/file'` or local relative paths
- No barrel re-exports with wildcards (`export * from`); specific named exports only

## Error Handling

**Patterns:**

**Try-Catch Blocks:**
```typescript
try {
  setIsLoading(true)
  setError(null)
  const response = await apiService.students.getStudentById(studentId)
  setStudent(response)
} catch (err) {
  console.error('❌ Error fetching student:', err)
  setError(err.message || 'Failed to load student data')
} finally {
  setIsLoading(false)
}
```

**React Query Error Handling:**
```typescript
const previewQuery = useQuery({
  queryKey: cascadeDeletionQueryKeys.preview(entityType!, entityId!),
  queryFn: async (): Promise<DeletionImpact> => {
    return cascadeDeletionService.previewDeletion(entityType, entityId)
  },
  enabled: !!entityType && !!entityId,
  onError: (error) => {
    const errorMessage = error instanceof CascadeDeletionError
      ? error.message
      : 'Failed to preview deletion'
  }
})
```

**Async/Await with Retry Logic:**
```typescript
// Retry with exponential backoff in auditTrailService
try {
  const response = await fetch(url, options)
} catch (error) {
  if (retryCount < AUDIT_API_CONFIG.retryAttempts &&
      error.message.includes('network')) {
    const delay = AUDIT_API_CONFIG.retryDelay * Math.pow(2, retryCount)
    await new Promise(resolve => setTimeout(resolve, delay))
    return this.makeRequest(endpoint, options, timeout, retryCount + 1)
  }
  throw error
}
```

**Custom Error Classes:**
```typescript
// Defined and thrown in services
throw new AuditTrailError(
  errorMessage,
  data?.entryId,
  data?.rollbackable || false
)
```

**Error State in Components:**
- Set error in catch block: `setError(err.message || 'Default message')`
- Store error in state with clear state on retry: `setError(null)` before async call
- Display errors conditionally: `{error && <div className="bg-red-100">{error}</div>}`

## Logging

**Framework:** `console` (native — no logging library)

**Patterns:**

**Console Methods:**
- `console.log()` — General info, data inspection — `console.log('🌐 Fetching student data for ID:', studentId)`
- `console.warn()` — Warnings — `console.warn('⚠️ Slow cascade deletion operation:', { ... })`
- `console.error()` — Errors — `console.error('❌ Error fetching student:', err)`
- Conditional debug logging: `if (this.debugMode) { console.error(...) }`

**Emoji Prefixes (Observability):**
```
🔍 Debug/inspection — 'StudentDetailsPage component loading...'
📝 Data tracking — 'Student ID from params'
🌐 Network/API calls — 'Fetching student data'
✅ Success states — 'Student data received'
❌ Errors — 'Error fetching student'
⚠️ Warnings — 'Slow operation'
🔄 State updates — 'Updating student data'
📚 Data structures — 'Enrollments in response'
👤 User tracking — 'Analytics user set'
🗑️ Deletion operations — 'Deletion operation tracked'
📊 Metrics/analytics — 'Dashboard analytics'
🎭 Component lifecycle — 'Component mounted'
🎯 User actions — 'User action tracked'
🧪 Testing — 'Running validation suite'
🚀 Deployment — 'Running post-deployment validation'
```

**When to Log:**
- API calls (request + response) — Log method, endpoint, response status
- State changes affecting user flow — Log before/after state
- Errors with context — Log full error object and surrounding context
- Performance monitoring — Log operation start/end times
- User actions in audit contexts — Log action type and affected entities

## Comments

**When to Comment:**
- Complex algorithms — Explain the why, not the what
- Non-obvious business logic — "Retry with exponential backoff for transient failures"
- Temporary workarounds — Mark with FIXME/TODO with context
- Data transformations — Document expected input/output shape

**JSDoc/TSDoc:**
- Used extensively for service methods, types, and hooks
- Document public APIs with param types and return types
- Example from `validationUtils.ts`:
```typescript
/**
 * Form Validation Utilities for Conservatory Management System
 *
 * Comprehensive validation functions with Hebrew error messages
 * and backend requirements compliance
 */
```

**Example from hook documentation:**
```typescript
/**
 * React Query Integration for Cascade Deletion Operations
 *
 * Provides comprehensive hooks for deletion operations with caching,
 * background updates, and error handling using React Query
 */
```

**Comment Headers for Sections:**
```typescript
// ==================== Query Keys ====================
// ==================== Main Cascade Deletion Hook ====================
// ==================== Preview Operations ====================
```

## Function Design

**Size:** Functions kept concise, typically under 50 lines per function; complex operations broken into multiple utility functions

**Parameters:**
- Named parameters for functions with 2+ args — Use destructuring for objects
- Type annotations required for all parameters in `.ts` files
- Optional params marked with `?` and initialized in function or with default values
- Example: `function useCascadeDeletion(entityType?: string, entityId?: string): UseCascadeDeletionReturn`

**Return Values:**
- Explicit return type annotations for non-trivial functions — `Promise<T>`, `UseCascadeDeletionReturn`
- Simple functions may omit return type (ESLint config allows this)
- Hooks return custom return interfaces bundling state, actions, and metadata

**Function Patterns:**

**React Component:**
```typescript
const StudentDetailsPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>()
  const [student, setStudent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Effect logic
  }, [studentId])

  return (
    // JSX
  )
}

export default StudentDetailsPage
```

**Service Method with Async/Await:**
```typescript
async getStudentById(studentId: string): Promise<Student> {
  try {
    const response = await fetch(this.buildUrl(`/students/${studentId}`), {
      headers: this.getHeaders()
    })
    return await this.handleResponse(response)
  } catch (error) {
    console.error('Error fetching student:', error)
    throw error
  }
}
```

**Custom Hook with React Query:**
```typescript
export function useCascadeDeletion(
  entityType?: string,
  entityId?: string
): UseCascadeDeletionReturn {
  const queryClient = useQueryClient()
  const store = useCascadeDeletionStore()

  const previewQuery = useQuery({
    queryKey: cascadeDeletionQueryKeys.preview(entityType!, entityId!),
    queryFn: async () => {
      return cascadeDeletionService.previewDeletion(entityType, entityId)
    },
    enabled: !!entityType && !!entityId
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => cascadeDeletionService.execute(id),
    onSuccess: () => queryClient.invalidateQueries()
  })

  return {
    preview: previewQuery.data,
    isLoading: previewQuery.isLoading,
    execute: deleteMutation.mutate
  }
}
```

## Module Design

**Exports:**
- Named exports for utilities, hooks, and services — `export function useCascadeDeletion() { ... }`
- Default export for React components only — `export default StudentDetailsPage`
- Consistent: If file exports one main thing, use default; multiple utilities use named
- Type exports: `export type UserType = { ... }` or `export interface Props { ... }`

**Barrel Files:**
- Used selectively in `src/types/` and `src/constants/`
- Example: `export * from './StudentTypes'` not recommended; use specific imports instead
- Prefer explicit imports to avoid circular dependencies

**File Organization:**
- Service files group related methods in a single object or class
- `apiService.js` (~5200 lines) centralizes all HTTP communication with sub-objects:
  ```javascript
  apiService.students.getStudentById()
  apiService.teachers.getTeacherById()
  apiService.orchestras.getOrchestraById()
  ```
- Hook files group related hooks and query key builders
- Type files group related interfaces and types, not spread across feature folders

## Code Quality Patterns

**Unused Variables:**
- Prefix intentional unused params with `_` to satisfy linter — `(_error) => { ... }`
- ESLint rule allows this: `"@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]`

**Type Safety:**
- Warn on `any` type — Prefer explicit types or `unknown` with type guard
- Warn on non-null assertion `!` — Use type narrowing instead when possible
- React.FC annotations used for component functions — `const Component: React.FC = () => { ... }`

**Immutability:**
- `prefer-const: error` enforced — All variables initialized with `const` unless reassigned
- State updates use setter functions, never direct mutation
- Object/array spreads for state updates — `setStudent({ ...student, updated: value })`

---

*Convention analysis: 2026-02-17*
