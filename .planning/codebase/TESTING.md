# Testing Patterns

**Analysis Date:** 2026-02-13

## Test Framework

**Runner:**
- Vitest 0.34.3
- Playwright 1.58.2 (for E2E tests)
- Config: No `vitest.config.ts` — inherits from `vite.config.ts`

**Assertion Library:**
- Playwright test assertions (`@playwright/test`)
- Testing Library assertions (`@testing-library/react`, `@testing-library/jest-dom`)

**Run Commands:**
```bash
npm run test              # Run unit tests (vitest)
npm run test:ui          # Vitest UI mode
npm run test:coverage    # Coverage report
npm run test:cascade     # Run cascade deletion tests only
npm run test:e2e:cascade # Playwright cascade deletion tests
npm run test:a11y:cascade # Axe accessibility tests
```

## Test File Organization

**Location:**
- E2E tests: `tests/e2e/` (separate from source)
- Unit tests: Co-located in `src/` alongside implementation
- Example: `src/services/calendarDataProcessor.test.ts` next to `calendarDataProcessor.ts`

**Naming:**
- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts` (Playwright convention)
- Auth storage files: `tests/e2e/.auth/[role].json` (e.g., `admin.json`, `super-admin.json`)

**E2E Test Files:**
```
tests/e2e/
├── .auth/
│   ├── admin.json          # Admin auth state
│   └── super-admin.json    # Super admin auth state
├── global-setup.ts         # Pre-test auth setup
├── helpers.ts              # Shared test utilities
├── 01-auth.spec.ts
├── 02-navigation.spec.ts
├── 03-dashboard.spec.ts
├── 04-students.spec.ts
├── 05-teachers.spec.ts
├── 06-orchestras.spec.ts
├── 07-schedule.spec.ts
├── 08-theory.spec.ts
├── 09-bagruts.spec.ts
├── 10-admin.spec.ts
├── 11-profile.spec.ts
└── 12-edge-cases.spec.ts
```

## Test Structure

**E2E Test Pattern (Playwright):**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Stage 1: Authentication', () => {
  test('1.1 — Login page loads', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()

    const direction = await page.locator('body').evaluate(
      (el) => getComputedStyle(el).direction
    )
    expect(direction).toBe('rtl')
  })

  test('1.2 — Failed login shows error', async ({ page }) => {
    await page.goto('/login')

    await page.fill('#email', 'wrong@email.com')
    await page.fill('#password', 'wrongpass')
    await page.click('button[type="submit"]')

    const errorBox = page.locator('[class*="bg-red"]')
    await expect(errorBox.first()).toBeVisible({ timeout: 10000 })

    expect(page.url()).toContain('/login')
  })
})
```

**Unit Test Pattern (from `calendarDataProcessor.test.ts`):**
```typescript
import { calendarDataProcessor } from './calendarDataProcessor'

const exampleStudentData = {
  _id: "66e36f123456789abcdef012",
  personalInfo: {
    fullName: "דוד כהן"
  },
  teacherAssignments: [
    {
      teacherId: "...",
      day: "שלישי",
      startTime: "14:30",
      duration: 45
    }
  ]
}

// Expected output format documented with annotations
const expectedCalendarEvents = [
  {
    _id: "lesson-...",
    title: "חצוצרה - יונתן ישעיהו",
    day: "שלישי",
    dayOfWeek: 2,
    startTime: "14:30",
    endTime: "15:15"
  }
]
```

**Patterns:**
- Arrange-Act-Assert structure (implicit in above examples)
- Hebrew test data throughout (reflects actual usage)
- Timeouts explicit: `{ timeout: 10000 }` for async operations
- Error messages in Hebrew
- Test descriptions use numbered stages with descriptions

## Mocking

**Framework:** Playwright built-in mocking, no additional mocking library

**Patterns:**
```typescript
// From helpers.ts
export async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('#email', 'admin@tenuto-dev.com')
  await page.fill('#password', 'Admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

// Storage state mocking from global-setup.ts
const STORAGE_STATE_PATH = 'tests/e2e/.auth/admin.json'
await adminPage.context().storageState({ path: STORAGE_STATE_PATH })
```

**What to Mock:**
- Network responses (localStorage, session storage)
- Authentication state (via `.auth/*.json` files)
- Page interactions (clicks, fills, navigation)

**What NOT to Mock:**
- API responses (integration tests hit real backend)
- Database state (seeded before test runs)
- Navigation (use real Router)

## Global Test Setup

**File:** `tests/e2e/global-setup.ts`

Purpose: Pre-authenticate users before any E2E test runs

Process:
1. Launch Chromium browser
2. Admin login: navigate to `/login`, fill credentials, capture storage state
3. Super admin login: same process for different credentials
4. Save both states to `tests/e2e/.auth/[role].json`
5. Tests reference these files with `test.use({ storageState: ... })`

```typescript
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5173'
  const browser = await chromium.launch()

  // Admin setup
  const adminPage = await browser.newPage()
  await adminPage.goto(`${baseURL}/login`)
  await adminPage.fill('#email', 'admin@tenuto-dev.com')
  await adminPage.fill('#password', 'Admin123')
  await adminPage.click('button[type="submit"]')
  await adminPage.waitForURL('**/dashboard', { timeout: 30000 })
  await adminPage.context().storageState({ path: STORAGE_STATE_PATH })
  await adminPage.close()

  await browser.close()
}
```

## Test Selectors

**Primary strategy:** ID selectors
```typescript
await page.locator('#email').fill('test@example.com')
await page.locator('#password').fill('password')
await page.locator('button[type="submit"]').click()
```

**Fallback:** Text or class selectors
```typescript
await page.locator('button:has-text("כניסה")').click()
await page.locator('[class*="bg-red"]').first()
await expect(page.locator('text=מנהל').first()).toBeVisible()
```

**Pattern:** Hebrew text used as last resort (tests UI in user language)

## Test Coverage

**Requirements:** No enforced minimum (coverage testing not gated in CI)

**View Coverage:**
```bash
npm run test:coverage
```

Outputs coverage report for all files touched by tests.

**Current coverage areas:**
- E2E tests: Authentication flow, navigation, CRUD operations
- Unit tests: Data processors (e.g., `calendarDataProcessor.test.ts`)
- Integration: No dedicated integration test suite

## Test Types

**Unit Tests:**
- Scope: Individual functions/utilities
- Approach: Import function, call with test data, verify output
- Example: `calendarDataProcessor.test.ts` — verifies calendar event generation
- Location: Co-located with source files

**E2E Tests:**
- Scope: Full user workflows (login, navigation, form submission)
- Approach: Playwright page automation against running application
- Base URL: `http://localhost:5173` (dev server)
- Auth: Uses pre-seeded storage states from `global-setup.ts`
- Location: `tests/e2e/*.spec.ts`

**Accessibility Tests:**
- Framework: Axe CLI
- Command: `npm run test:a11y:cascade`
- Targets: Elements with `[data-testid*="cascade"]`
- Scope: Limited to cascade deletion components

**Integration Tests:**
- Not currently implemented as dedicated tests
- E2E tests serve as integration tests (full stack)

## Common Patterns

**Async Testing (Playwright):**
```typescript
// Wait for navigation
await page.waitForURL('**/dashboard', { timeout: 15000 })

// Wait for element visibility
await expect(page.locator('text=מנהל')).toBeVisible({ timeout: 10000 })

// Wait for condition
await page.waitForLoadState('networkidle')

// Reload and verify persistence
await page.reload()
expect(page.url()).toContain('/dashboard')
```

**Console Error Collection (for debugging):**
```typescript
// From helpers.ts
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      !msg.text().includes('vite.svg') &&
      !msg.text().includes('WebSocket') &&
      !msg.text().includes('favicon')
    ) {
      errors.push(msg.text())
    }
  })
  return errors
}
```

Filters out known non-issues: Vite assets, WebSocket warnings, favicon 404s

**Error Testing (E2E):**
```typescript
test('Failed login shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'wrong@email.com')
  await page.fill('#password', 'wrongpass')
  await page.click('button[type="submit"]')

  // Wait for error message
  const errorBox = page.locator('[class*="bg-red"]')
  await expect(errorBox.first()).toBeVisible({ timeout: 10000 })
})
```

**Auth Testing Pattern:**
```typescript
// Tests that need fresh auth state start unauthenticated
test.use({ storageState: { cookies: [], origins: [] } })

test('Auth persists on refresh', async ({ page }) => {
  await loginAsAdmin(page)  // Helper function
  await page.reload()
  expect(page.url()).toContain('/dashboard')
})
```

## Playwright Configuration

**Location:** `playwright.config.ts` (inferred from test imports and global-setup)

**Key settings:**
- Base URL: `http://localhost:5173`
- Browser: Chromium (launched in `global-setup.ts`)
- Global setup: `tests/e2e/global-setup.ts`
- Storage state files: Pre-generated in `.auth/` directory
- Timeout: 30000ms (30 sec) for critical operations like auth

**Test execution:**
- Parallel by default (multiple tests run simultaneously)
- Serialization for auth tests (single thread to avoid conflicts)

---

*Testing analysis: 2026-02-13*
