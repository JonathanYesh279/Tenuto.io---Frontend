# Coding Conventions

**Analysis Date:** 2026-02-13

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `StudentDetailsPage.tsx`, `TeacherForm.tsx`)
- Utilities/services: camelCase with `.ts` extension (e.g., `validationUtils.ts`, `apiService.js`)
- Hooks: camelCase with `use` prefix (e.g., `useCascadeDeletion.ts`, `useTeacherData.ts`)
- Types/interfaces: PascalCase in `types/` subdirectories (e.g., `TabType` from `../types`)

**Functions:**
- React component functions: PascalCase (e.g., `StudentDetailsPage`, `TeacherTabNavigation`)
- Async API calls: camelCase (e.g., `fetchStudent`, `handleConfirmDelete`)
- Callbacks: `handle` prefix for UI interactions (e.g., `handleDeleteClick`, `handleStudentUpdate`)
- Query-related: prefixed with `use` for hooks (e.g., `useQuery`, `useMutation`)

**Variables:**
- State: camelCase (e.g., `isLoading`, `showDeleteModal`, `activeTab`)
- Boolean flags: `is` or `has` prefixes (e.g., `isDeleting`, `hasError`, `showTechnicalDetails`)
- Component props: camelCase (e.g., `entityType`, `entityId`, `storageState`)

**Types:**
- Interfaces: PascalCase (e.g., `ValidationRule`, `DeletionImpact`, `UseCascadeDeletionReturn`)
- Type aliases: PascalCase (e.g., `TabType`)
- Enums: UPPERCASE_SNAKE_CASE for enum values (e.g., `VALID_CLASSES`, `VALID_INSTRUMENTS`)

## Code Style

**Formatting:**
- Prettier 3.0.1 enforced with configuration in `prettier.config.js`
- Tab width: 2 spaces
- Print width: 80 characters
- Quotes: single quotes (not double)
- Trailing commas: ES5 style
- Arrow parens: omitted when possible (e.g., `x => x`, not `(x) => x`)
- Semicolons: none (Prettier configured with `semi: false`)
- Line endings: LF only

**Linting:**
- ESLint 8.45.0 with TypeScript support
- Config: `.eslintrc.json`
- Enforced rules:
  - `@typescript-eslint/no-unused-vars`: error (ignores vars starting with `_`)
  - `@typescript-eslint/no-explicit-any`: warning
  - `prefer-const`: error (no `let` unless reassigned)
  - `no-var`: error (use `const`/`let` only)
  - `react-refresh/only-export-components`: warning (components as default exports OK)
- Run: `npm run lint` (max warnings: 0), `npm run lint:fix` for auto-fix

**TypeScript:**
- Target: ES2020
- Module: ESNext
- `strict: false` (no strict mode enforcement)
- JSX: react-jsx (no `import React` needed)
- Path aliases: `@/*` maps to `./src/*` (use absolute imports)

## Import Organization

**Order:**
1. React and framework imports (`react`, `react-router-dom`, `@tanstack/react-query`)
2. UI library imports (`lucide-react`, `@headlessui/react`, `@radix-ui/*`)
3. Local service/context imports (`../services`, `../contexts`)
4. Local component imports (`./components`, `../components`)
5. Local utility imports (`../utils`, `../hooks`)
6. Local type imports (`../types`)

**Path Aliases:**
- Always use `@/` prefix for imports from `src/` (e.g., `@/services/apiService`, `@/types/cascade-deletion.types`)
- Import destructuring preferred: `import { getDisplayName } from '@/utils/nameUtils'`
- No relative paths across directories; use `@/` alias

**Example from codebase (`StudentDetailsPage.tsx`):**
```typescript
import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { TabType } from '../types'
import StudentTabNavigation from './StudentTabNavigation'
import apiService from '@/services/apiService'
import { getDisplayName } from '@/utils/nameUtils'
import { useCascadeDeletion } from '@/hooks/useCascadeDeletion'
```

## Error Handling

**Patterns:**
- Try-catch blocks used extensively (638 occurrences across codebase)
- Error objects shaped with `code` and `message` properties:
  ```typescript
  setError({
    code: err.status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR',
    message: err.message || 'שגיאה בטעינת נתוני התלמיד'
  })
  ```
- Async operations wrapped in try-catch with `finally` blocks to reset loading states
- Error boundary component: `SecurityErrorBoundary.tsx` for React errors
- HTTP errors handled in `apiService.js` with retry logic on 401 (auth refresh)

**Custom Error Classes:**
- `CascadeDeletionError` for deletion operations with code/message
- `SecurityError` for security-related issues
- All errors logged with context before user display

## Logging

**Framework:** Console methods (no dedicated logging library)

**Patterns:**
- Development logging: `console.log('message')`, `console.error('message')`, `console.warn('message')`
- Emoji prefixes used for visual distinction:
  - `🔍` for info/debugging
  - `✅` for success
  - `❌` for errors
  - `🔄` for operations
  - `🔐` for auth-related
- Examples from codebase:
  ```typescript
  console.log('🔍 StudentDetailsPage component loading...')
  console.log('✅ Student data loaded successfully:', getDisplayName(studentData.personalInfo))
  console.error('❌ Error fetching student:', err)
  console.log('🔄 Fetching student data for ID:', studentId)
  ```
- Console errors collected in tests via `collectConsoleErrors()` helper
- Filtering in test helpers: ignore vite.svg, WebSocket, favicon errors

## Comments

**When to Comment:**
- Complex logic requiring explanation
- Business logic related to Hebrew calendar, bagrut system, or domain-specific rules
- Public API/service method documentation

**JSDoc/TSDoc:**
- Used for public functions and components
- Example from `apiService.js`:
  ```typescript
  /**
   * Get stored authentication token
   */
  getStoredToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
  ```
- Component level docs: Brief summary at top of file
- Function level docs: Docstring above async handlers and complex computations

## Function Design

**Size:**
- Average function length: 15-80 lines (typical React components and handlers)
- Large complex components split into sub-components
- Hooks used for shared state logic (e.g., `useCascadeDeletion.ts` is 80+ lines)

**Parameters:**
- Props objects preferred over multiple params for components
- Destructuring in function signatures:
  ```typescript
  const StudentDetailsPage: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>()
    const [student, setStudent] = useState(null)
  ```
- API methods: use object params for flexibility
  ```typescript
  cascadeDeletionService.previewDeletion(entityType, entityId)
  ```

**Return Values:**
- Async functions return `Promise<T>` with proper typing
- React components return `React.FC` or `JSX.Element`
- Hooks return object with state and handlers:
  ```typescript
  return {
    previewDeletion,
    executeDeletion,
    isDeleting
  }
  ```
- Custom hooks pattern: `useCallback` for memoized async operations

## Module Design

**Exports:**
- Default export: main component/function (e.g., `export default StudentDetailsPage`)
- Named exports: utility functions, types, constants
- Mixed approach in some modules:
  ```typescript
  export const cascadeDeletionQueryKeys = { ... }
  export function useCascadeDeletion(...) { ... }
  export default StoreComponent
  ```

**Barrel Files:**
- Used for types: `src/features/students/details/types/` contains interfaces
- Used for constants: `src/utils/validationUtils.ts` exports all validation constants
- Pattern: `export { Component1, Component2, Component3 }` for collections

## Module Organization

**Layout within feature modules:**
- `src/features/[feature]/details/`
  - `components/` — React components
  - `hooks/` — Feature-specific hooks
  - `types/` — TypeScript interfaces
  - `[FeatureName]Page.tsx` — Main container component

**Services location:**
- `src/services/` — Centralized services
- All HTTP calls in `src/services/apiService.js` (~4800 lines, monolithic)
- Context providers in `src/services/` (e.g., `authContext.jsx`)

**Hooks location:**
- `src/hooks/` — Shared hooks
- Feature-specific hooks in `src/features/[feature]/` if only used there
- Hooks follow `use[Name].ts` naming

## State Management Pattern

**Hierarchy:**
1. React Context for global state (auth, school year, bagrut settings)
2. Zustand for cascade deletion UI state
3. React Query for server state caching
4. Local `useState` for component UI state (loading, modals, active tabs)

**Example from StudentDetailsPage:**
- Context usage: `useWebSocketStatus()`, `usePerformanceOptimizations()`
- Query usage: `useCascadeDeletion()` (React Query under hood)
- Local state: `activeTab`, `showDeleteModal`, `student`, `isLoading`

---

*Convention analysis: 2026-02-13*
