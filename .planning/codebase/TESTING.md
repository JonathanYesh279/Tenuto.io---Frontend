# Testing Patterns

**Analysis Date:** 2026-02-17

## Test Framework

**Runner:**
- Vitest v0.34.3
- Config: `package.json` scripts (no separate vitest.config.js detected; uses defaults)
- Also Playwright v1.58.2 for E2E testing

**E2E Test Framework:**
- Playwright with TypeScript
- Config: `playwright.config.ts`
- Test directory: `tests/e2e/`
- Base URL: `http://localhost:5173`
- Locale: Hebrew (`he-IL`)
- Timezone: Asia/Jerusalem

**Assertion Library:**
- Vitest uses chai/vitest assertions
- Playwright uses built-in `.toBeVisible()`, `.toContainText()`, `.toHaveURL()` matchers

**Run Commands:**
```bash
npm run test              # Run all unit/integration tests with vitest
npm run test:ui          # Vitest with UI dashboard
npm run test:coverage    # Generate coverage report
npm run test:cascade     # Run cascade deletion tests only
npm run test:e2e:cascade # Playwright E2E for cascade deletion
```

## Test File Organization

**Location:**
- Unit/integration tests: Co-located with source — `src/services/calendarDataProcessor.test.ts` next to `src/services/calendarDataProcessor.ts`
- E2E tests: Separate directory — `tests/e2e/*.spec.ts`
- Test data/fixtures: No centralized factory folder detected; inline in test files

**Naming:**
- Unit tests: `*.test.ts` or `*.test.tsx` — `calendarDataProcessor.test.ts`
- E2E tests: `*.spec.ts` — `01-auth.spec.ts`, `02-navigation.spec.ts`
- Numbered prefixes for E2E test execution order — `01-auth.spec.ts`, `04-students-details.spec.ts`

**Structure:**
```
tests/e2e/
├── global-setup.ts           # Global test setup (auth state)
├── .auth/
│   └── admin.json            # Pre-authenticated admin state
├── 01-auth.spec.ts           # Authentication tests
├── 02-navigation.spec.ts     # Navigation tests
├── 03-dashboard.spec.ts      # Dashboard tests
├── 04-students-details.spec.ts
├── 04-students.spec.ts
├── ... (numbered by feature)
└── 12-edge-cases.spec.ts

src/
└── services/
    ├── calendarDataProcessor.ts
    └── calendarDataProcessor.test.ts  # Co-located test
```

## Test Structure

**Suite Organization:**

```typescript
// Playwright E2E example from tests/e2e/01-auth.spec.ts
import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Stage 1: Authentication', () => {
  test('1.1 — Login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
  });

  test('1.2 — Failed login shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'wrong@email.com');
    await page.fill('#password', 'wrongpass');
    await page.click('button[type="submit"]');
    const errorBox = page.locator('[class*="bg-red"]');
    await expect(errorBox.first()).toBeVisible({ timeout: 10000 });
  });
});
```

**Patterns:**

**BeforeEach Setup:**
```typescript
test.describe('Stage 2: Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('2.1 — Sidebar renders all admin menu items', async ({ page }) => {
    // Test logic
  });
});
```

**Teardown/Cleanup:** Implicit in Playwright — each test runs in isolated context with pre-authenticated state (`storageState: 'tests/e2e/.auth/admin.json'`)

**Assertion Patterns:**

```typescript
// Visibility assertions
await expect(page.locator('#email')).toBeVisible();
await expect(page.locator('button[type="submit"]')).toContainText('כניסה');

// Navigation assertions
expect(page.url()).toContain('/dashboard');
await page.waitForURL('**/dashboard', { timeout: 15000 });

// State assertions
const direction = await page.locator('body').evaluate((el) => getComputedStyle(el).direction);
expect(direction).toBe('rtl');

// Content assertions
await expect(page.locator('text=מנהל').first()).toBeVisible({ timeout: 10000 });
```

## Mocking

**Framework:** Playwright built-in mocking (route interception) + optional fetch mocking for API tests

**Patterns:**

**Playwright Route Mocking (E2E):**
```typescript
// Example: Mock API response in E2E test
test('test with mocked API', async ({ page }) => {
  await page.route('**/api/students/**', (route) => {
    route.abort();  // Block requests
  });
  // OR
  await page.route('**/api/students/**', (route) => {
    route.continue({ postData: JSON.stringify({ mocked: true }) });
  });
});
```

**What to Mock:**
- External API calls in unit tests (use Vitest mocks)
- Heavy async operations with known responses
- WebSocket connections (if tested separately)

**What NOT to Mock:**
- Internal React state and hooks
- Component rendering logic
- Navigation within same app
- Database interactions in integration tests (test real behavior unless isolated)

## Fixtures and Factories

**Test Data:**

Example from `calendarDataProcessor.test.ts`:
```typescript
const exampleStudentData = {
  _id: "66e36f123456789abcdef012",
  personalInfo: {
    fullName: "דוד כהן"
  },
  teacherAssignments: [
    {
      teacherId: "6880d12f5a3def220d8857d5",
      day: "שלישי",
      startTime: "14:30",
      duration: 45,
      instrumentName: "חצוצרה"
    }
  ],
  orchestraEnrollments: ["6883badc14f0fcfae92ac453"],
  instrumentProgress: [
    {
      instrumentName: "חצוצרה",
      level: "מתחיל"
    }
  ]
}

const exampleTeacherData = {
  _id: "6880d12f5a3def220d8857d5",
  name: "יונתן ישעיהו",
  timeBlocks: [
    {
      day: "שלישי",
      startTime: "14:00",
      endTime: "17:00",
      location: "חדר מחשבים"
    }
  ]
}

export { exampleStudentData, exampleTeacherData, exampleOrchestraData, expectedCalendarEvents }
```

**Location:**
- Test fixtures defined inline within test files — No separate factory directory
- Exported from test files for reuse — `export { exampleStudentData, ... }`
- Real backend data structure matched — Field names match API responses exactly

## Coverage

**Requirements:** Not enforced (no coverage gate in CI)

**View Coverage:**
```bash
npm run test:coverage
```

**Current State:** Coverage reports generated but not required for PR merge

## Test Types

**Unit Tests:**
- Scope: Individual functions/utilities (e.g., `calendarDataProcessor.test.ts`)
- Approach: Inline test data, sync assertions
- Example: Data transformation logic, calculation functions

**Integration Tests:**
- Scope: Service methods with API mocking or React hooks with React Testing Library
- Approach: Mock external dependencies, test component behavior
- Not heavily used (most tests are E2E)

**E2E Tests:**
- Framework: Playwright
- Scope: Full user workflows (auth, navigation, CRUD operations)
- Approach: Real app in real browser, pre-authenticated state
- Coverage: 12 test suites covering:
  - Authentication (login, logout, session persistence)
  - Navigation (sidebar, menu, page routing)
  - Dashboard (stats, charts, quick actions)
  - Student/Teacher CRUD (details, tabs, forms)
  - Orchestra management
  - Schedule calendar
  - Theory lessons
  - Bagrut exam workflows
  - Admin audit trail
  - User profile
  - Edge cases and error scenarios

**Examples:**

`tests/e2e/04-students-details.spec.ts`:
```typescript
test.describe('Stage 4B-List: Students List Page', () => {
  test('4B.1 — Students list loads with student data', async ({ page }) => {
    await page.goto('/students');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('4B.2 — Search filters results by name', async ({ page }) => {
    await page.goto('/students');
    await page.fill('input[placeholder*="חיפוש"]', 'דוד');
    // Verify filtered results
  });
});

test.describe('Stage 4B-Personal: Personal Info Tab', () => {
  test('4B.10 — Personal info tab renders student fields', async ({ page }) => {
    // Navigate to student details
    // Verify form fields present
  });
});
```

## Common Patterns

**Async Testing:**

```typescript
// Playwright automatic waits
test('waits for async operations', async ({ page }) => {
  await page.fill('#email', 'test@example.com');
  await page.click('button[type="submit"]');

  // Auto-waits for navigation
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  // Auto-waits for visibility
  await expect(page.locator('text=מנהל')).toBeVisible({ timeout: 10000 });

  // Load state waits for network
  await page.waitForLoadState('networkidle');
});
```

**Error/Exception Testing:**

```typescript
// Playwright catches and reports errors automatically
test('handles error states', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'wrong@email.com');
  await page.fill('#password', 'wrongpass');
  await page.click('button[type="submit"]');

  // Expect error message to appear
  const errorBox = page.locator('[class*="bg-red"]');
  await expect(errorBox.first()).toBeVisible({ timeout: 10000 });

  // Should still be on login page
  expect(page.url()).toContain('/login');
});
```

**Loading State Testing:**

```typescript
test('shows loading state during fetch', async ({ page }) => {
  await page.goto('/students');

  // Wait for loading spinner to disappear
  await page.waitForSelector('.animate-spin', { state: 'hidden' });

  // Verify data is now visible
  await expect(page.locator('table')).toBeVisible();
});
```

**Form Input Testing:**

```typescript
test('form submission with validation', async ({ page }) => {
  await page.goto('/student-form');

  // Fill required fields
  await page.fill('#firstName', 'דוד');
  await page.fill('#lastName', 'כהן');
  await page.selectOption('#instrument', 'כינור');

  // Submit and verify success
  await page.click('button[type="submit"]');
  await expect(page.locator('text=נשמר בהצלחה')).toBeVisible({ timeout: 10000 });
});
```

**Tab Navigation Testing (Multi-Tab Detail Pages):**

```typescript
test('switches between tabs in student details', async ({ page }) => {
  // Navigate to student details
  await page.goto('/students/[id]');

  // Click tab
  await page.click('button:has-text("מידע אקדמי")');

  // Verify content changed
  await expect(page.locator('text=כלי נגינה')).toBeVisible();
});
```

**RTL Layout Testing:**

```typescript
test('verifies RTL layout', async ({ page }) => {
  await page.goto('/');

  const direction = await page.locator('body').evaluate(
    (el) => getComputedStyle(el).direction
  );
  expect(direction).toBe('rtl');
});
```

## Test Configuration

**Playwright Config** (`playwright.config.ts`):
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,           // 30 second test timeout
  retries: 1,               // Retry failed tests once
  globalSetup: './tests/e2e/global-setup.ts',  // Auth setup
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    storageState: 'tests/e2e/.auth/admin.json',  // Pre-auth state
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

**Environment:**
- Must start dev server manually: `npm run dev`
- Tests run against live frontend (not mocked)
- Real API calls to backend (test env)

## Test Execution Order

E2E tests numbered for logical execution flow:
1. **01-auth** — Authentication must work first
2. **02-navigation** — Navigation depends on auth
3. **03-dashboard** — Dashboard visible after auth
4. **04-students** — List and detail pages
5. **05-teachers** — Teacher management
6. **06-orchestras** — Orchestra management
7. **07-schedule** — Schedule/calendar
8. **08-theory** — Theory lessons
9. **09-bagruts** — Bagrut exam system
10. **10-admin** — Admin features (audit, settings)
11. **11-profile** — User profile
12. **12-edge-cases** — Error scenarios and edge cases

## CI Integration

Tests disabled in CI pipeline initially (see `.github/workflows/ci.yml`). Enable tests stage when test suite is stable:

```yaml
tests:
  name: Tests
  needs: lint
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm run test:coverage
```

---

*Testing analysis: 2026-02-17*
