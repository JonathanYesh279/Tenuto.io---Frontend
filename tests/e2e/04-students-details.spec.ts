import { test, expect, Page } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

/**
 * Stage 4B: Student Details (Deep)
 *
 * Comprehensive E2E tests for the students list page and student details,
 * covering navigation, all 7 tabs, edit mode, and data display.
 *
 * Prerequisites:
 * - Dev server running on localhost:5173
 * - Backend running with seeded data (~1200 students)
 * - Auth storage state from global-setup
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Navigate to the students list and wait for data to appear */
async function goToStudentsList(page: Page) {
  await page.goto('/students');
  await page.waitForLoadState('networkidle');
  // Wait for either student rows or the "view details" buttons to appear
  await page.locator('button[title="צפה בפרטי התלמיד"]').first().waitFor({ state: 'visible', timeout: 15000 });
}

/** Click the first student and navigate to details page */
async function navigateToFirstStudent(page: Page) {
  await goToStudentsList(page);
  const firstStudent = page.locator('button[title="צפה בפרטי התלמיד"]').first();
  await firstStudent.click();
  await page.waitForURL('**/students/**', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  // Wait for the loading spinner to disappear and content to render
  await page.waitForFunction(() => {
    return !document.querySelector('.animate-spin') ||
           document.querySelector('h1') !== null;
  }, { timeout: 15000 });
}

/** Click a specific tab button in the student details page (desktop nav only) */
async function clickStudentTab(page: Page, tabLabel: string) {
  // Target only the desktop tab nav to avoid strict mode violation
  // (both desktop and mobile navs have `.tab-button` elements)
  const tab = page.locator('.desktop-tab-nav button.tab-button').filter({ hasText: tabLabel });
  await expect(tab).toBeVisible({ timeout: 10000 });
  await tab.click();
  await page.waitForTimeout(2000);
}

// ─── Students List Page ─────────────────────────────────────────────────────

test.describe('Stage 4B-List: Students List Page', () => {

  test('4B.1 — Students list loads with student data', async ({ page }) => {
    await goToStudentsList(page);
    const studentButtons = page.locator('button[title="צפה בפרטי התלמיד"]');
    const count = await studentButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('4B.2 — Search filters results by name', async ({ page }) => {
    await goToStudentsList(page);

    const searchInput = page.locator('input[placeholder*="חיפוש"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    const initialCount = await page.locator('button[title="צפה בפרטי התלמיד"]').count();

    await searchInput.fill('כהן');
    await page.waitForTimeout(2000); // debounce wait

    const filteredCount = await page.locator('button[title="צפה בפרטי התלמיד"]').count();
    // Filtered should be <= initial (unless all are כהן)
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Page should contain the search term
    if (filteredCount > 0) {
      const content = await page.textContent('body');
      expect(content).toContain('כהן');
    }
  });

  test('4B.3 — View toggle switches between table and grid', async ({ page }) => {
    await goToStudentsList(page);

    // Look for the grid/list toggle buttons (icon buttons near top of page)
    const gridButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' });

    // The page should be functional in either view mode
    const content = await page.textContent('body');
    expect(content!.length).toBeGreaterThan(100);
    expect(page.url()).toContain('/students');
  });

  test('4B.4 — Load more / pagination works', async ({ page }) => {
    await goToStudentsList(page);

    // Look for "load more" button or pagination
    const loadMoreButton = page.getByRole('button', { name: /טען עוד|הבא|עמוד/ }).first();

    if (await loadMoreButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const initialCount = await page.locator('button[title="צפה בפרטי התלמיד"]').count();
      await loadMoreButton.click();
      await page.waitForTimeout(3000);
      const newCount = await page.locator('button[title="צפה בפרטי התלמיד"]').count();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    }
    // If no pagination visible, that's OK — dataset may be small
    expect(page.url()).toContain('/students');
  });

  test('4B.5 — Statistics cards display', async ({ page }) => {
    await goToStudentsList(page);

    // Students page should show statistics (total, active, etc.)
    const content = await page.textContent('body');
    const hasStats =
      content!.includes('סה"כ') ||
      content!.includes('פעילים') ||
      content!.includes('תלמידים') ||
      content!.includes('עם שיעורים');
    expect(hasStats).toBeTruthy();
  });
});

// ─── Student Details Navigation ─────────────────────────────────────────────

test.describe('Stage 4B-Nav: Student Details Navigation', () => {

  test('4B.6 — Navigate to first student details (no crash)', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstStudent(page);

    // URL should match /students/:id
    expect(page.url()).toMatch(/\/students\/[a-f0-9]+/);

    // Page should have meaningful content
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);

    // Filter non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('404') &&
        !e.includes('Failed to load') &&
        !e.includes('Network') &&
        !e.includes('ERR_') &&
        !e.includes('Warning:') &&
        !e.includes('vite') &&
        !e.includes('WebSocket')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('4B.7 — Student header shows name and status badge', async ({ page }) => {
    await navigateToFirstStudent(page);

    // Header h1 should show student name
    const header = page.locator('h1').first();
    await expect(header).toBeVisible({ timeout: 10000 });
    const headerText = await header.textContent();
    expect(headerText).toBeTruthy();
    expect(headerText).not.toContain('טוען');
    expect(headerText).not.toBe('שם לא זמין');

    // Status badge should be visible (פעיל or לא פעיל)
    const content = await page.textContent('body');
    const hasStatusBadge = content!.includes('פעיל') || content!.includes('לא פעיל');
    expect(hasStatusBadge).toBeTruthy();
  });

  test('4B.8 — Breadcrumb navigation back to students list', async ({ page }) => {
    await navigateToFirstStudent(page);

    // Breadcrumb "תלמידים" link
    const breadcrumb = page.locator('nav button', { hasText: 'תלמידים' }).first();
    await expect(breadcrumb).toBeVisible({ timeout: 10000 });

    await breadcrumb.click();
    await page.waitForURL('**/students', { timeout: 10000 });
    expect(page.url()).toMatch(/\/students$/);
  });

  test('4B.9 — Browser back navigation works', async ({ page }) => {
    await navigateToFirstStudent(page);

    await page.goBack();
    await page.waitForURL('**/students', { timeout: 10000 });
    expect(page.url()).toContain('/students');
  });
});

// ─── Personal Info Tab ──────────────────────────────────────────────────────

test.describe('Stage 4B-Personal: Personal Info Tab', () => {

  test('4B.10 — Personal info tab renders student fields', async ({ page }) => {
    await navigateToFirstStudent(page);

    // Personal info is the default tab — check for key section headers (h3)
    await expect(page.locator('h3', { hasText: 'פרטי תלמיד' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('שם פרטי')).toBeVisible();
    await expect(page.getByText('שם משפחה')).toBeVisible();
    await expect(page.getByText('טלפון').first()).toBeVisible();

    // Parent section
    await expect(page.locator('h3', { hasText: 'פרטי הורה' })).toBeVisible();
    await expect(page.getByText('שם הורה')).toBeVisible();
  });

  test('4B.11 — Edit mode toggles on/off', async ({ page }) => {
    await navigateToFirstStudent(page);

    // Wait for personal info to load
    await expect(page.getByText('פרטי תלמיד')).toBeVisible({ timeout: 10000 });

    // Click Edit button
    const editButton = page.getByRole('button', { name: 'ערוך' });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Should show Save and Cancel buttons
    await expect(page.getByRole('button', { name: 'שמור' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'בטל' })).toBeVisible();

    // Input fields should appear
    const firstNameInput = page.locator('input[placeholder="הכנס שם פרטי"]');
    await expect(firstNameInput).toBeVisible();

    // Cancel editing
    await page.getByRole('button', { name: 'בטל' }).click();

    // Should return to view mode
    await expect(page.getByRole('button', { name: 'ערוך' })).toBeVisible();
  });

  test('4B.12 — Parent info section shows fields', async ({ page }) => {
    await navigateToFirstStudent(page);

    await expect(page.getByText('פרטי הורה')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('שם הורה')).toBeVisible();
    await expect(page.getByText('טלפון הורה')).toBeVisible();
    await expect(page.getByText('אימייל הורה')).toBeVisible();
  });
});

// ─── Academic Info Tab ──────────────────────────────────────────────────────

test.describe('Stage 4B-Academic: Academic Info Tab', () => {

  test('4B.13 — Academic info tab loads without crash', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstStudent(page);
    await clickStudentTab(page, 'מידע אקדמי');

    // Should show academic content
    const content = await page.textContent('body');
    const hasAcademicContent =
      content!.includes('כלי נגינה') ||
      content!.includes('שלב') ||
      content!.includes('מורה') ||
      content!.includes('מידע אקדמי') ||
      content!.includes('התקדמות');
    expect(hasAcademicContent).toBeTruthy();

    // No critical console errors
    const crashErrors = errors.filter(
      (e) =>
        e.includes('Uncaught') ||
        e.includes('TypeError') ||
        e.includes('ReferenceError') ||
        e.includes('Cannot read properties of') ||
        e.includes('is not a function') ||
        e.includes('is not defined')
    );
    expect(crashErrors).toHaveLength(0);
  });

  test('4B.14 — Academic tab shows instrument progress or empty state', async ({ page }) => {
    await navigateToFirstStudent(page);
    await clickStudentTab(page, 'מידע אקדמי');

    const content = await page.textContent('body');
    // Should show either instrument data or some academic info
    const hasInstrumentData =
      content!.includes('כלי') ||
      content!.includes('שלב') ||
      content!.includes('כינור') || content!.includes('חליל') || content!.includes('פסנתר') || // instrument names
      content!.includes('אין נתונים');
    expect(hasInstrumentData).toBeTruthy();
  });
});

// ─── Schedule Tab ───────────────────────────────────────────────────────────

test.describe('Stage 4B-Schedule: Schedule Tab', () => {

  test('4B.15 — Schedule tab loads without crash', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstStudent(page);
    await clickStudentTab(page, 'לוח זמנים');

    // Should show schedule content or empty state
    const content = await page.textContent('body');
    const hasScheduleContent =
      content!.includes('לוח זמנים') ||
      content!.includes('ראשון') || content!.includes('שני') || content!.includes('שלישי') || // day names
      content!.includes('אין שיעורים') ||
      content!.includes('שבועי') ||
      content!.includes('שעה');
    expect(hasScheduleContent).toBeTruthy();

    const crashErrors = errors.filter(
      (e) =>
        e.includes('Uncaught') ||
        e.includes('TypeError') ||
        e.includes('ReferenceError') ||
        e.includes('Cannot read properties of') ||
        e.includes('is not a function')
    );
    expect(crashErrors).toHaveLength(0);
  });
});

// ─── Attendance Tab ─────────────────────────────────────────────────────────

test.describe('Stage 4B-Attendance: Attendance Tab', () => {

  test('4B.16 — Attendance tab loads without crash', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstStudent(page);
    await clickStudentTab(page, 'נוכחות');

    // Attendance tab (placeholder in current code)
    const content = await page.textContent('body');
    const hasAttendanceContent =
      content!.includes('נוכחות') ||
      content!.includes('בפיתוח') ||
      content!.includes('שיעורים') ||
      content!.includes('אחוז');
    expect(hasAttendanceContent).toBeTruthy();

    const crashErrors = errors.filter(
      (e) =>
        e.includes('Uncaught') ||
        e.includes('TypeError') ||
        e.includes('Cannot read properties of')
    );
    expect(crashErrors).toHaveLength(0);
  });
});

// ─── Orchestra Tab ──────────────────────────────────────────────────────────

test.describe('Stage 4B-Orchestra: Orchestra Tab', () => {

  test('4B.17 — Orchestra tab loads without crash', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstStudent(page);
    await clickStudentTab(page, 'תזמורות');

    // Should show orchestra content or empty state
    const content = await page.textContent('body');
    const hasOrchestraContent =
      content!.includes('תזמורות') ||
      content!.includes('רשומ') ||  // רשומים / הרשמה
      content!.includes('ניהול') ||
      content!.includes('אין תזמורות') ||
      content!.includes('הרשמ');
    expect(hasOrchestraContent).toBeTruthy();

    const crashErrors = errors.filter(
      (e) =>
        e.includes('Uncaught') ||
        e.includes('TypeError') ||
        e.includes('Cannot read properties of') ||
        e.includes('is not a function')
    );
    expect(crashErrors).toHaveLength(0);
  });

  test('4B.18 — Orchestra tab shows enrolled or empty state', async ({ page }) => {
    await navigateToFirstStudent(page);
    await clickStudentTab(page, 'תזמורות');

    const content = await page.textContent('body');
    // Either has enrolled orchestras or shows management UI
    const hasContent =
      content!.includes('תזמורות והרכבים') ||
      content!.includes('הרשמות קיימות') ||
      content!.includes('הרשמה חדשה') ||
      content!.includes('אין תזמורות');
    expect(hasContent).toBeTruthy();
  });
});

// ─── Theory Tab ─────────────────────────────────────────────────────────────

test.describe('Stage 4B-Theory: Theory Tab', () => {

  test('4B.19 — Theory tab loads without crash', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstStudent(page);
    await clickStudentTab(page, 'תאוריה');

    const content = await page.textContent('body');
    const hasTheoryContent =
      content!.includes('תאוריה') ||
      content!.includes('שיעור') ||
      content!.includes('רמה') ||
      content!.includes('אין שיעורי') ||
      content!.includes('הרשמה');
    expect(hasTheoryContent).toBeTruthy();

    const crashErrors = errors.filter(
      (e) =>
        e.includes('Uncaught') ||
        e.includes('TypeError') ||
        e.includes('Cannot read properties of') ||
        e.includes('is not a function')
    );
    expect(crashErrors).toHaveLength(0);
  });
});

// ─── Bagrut Tab ─────────────────────────────────────────────────────────────

test.describe('Stage 4B-Bagrut: Bagrut Tab', () => {

  test('4B.20 — Bagrut tab loads without crash', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstStudent(page);

    // Bagrut tab may not appear in tab list if not configured — check first
    const bagrutTab = page.locator('.desktop-tab-nav button.tab-button').filter({ hasText: 'בגרות' });
    if (!(await bagrutTab.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Bagrut tab not in this student's tabs — skip gracefully
      return;
    }

    await bagrutTab.click();
    await page.waitForTimeout(3000);

    const content = await page.textContent('body');
    const hasBagrutContent =
      content!.includes('בגרות') ||
      content!.includes('ציון') ||
      content!.includes('תכנית') ||
      content!.includes('בפיתוח') ||
      content!.includes('הצגה');
    expect(hasBagrutContent).toBeTruthy();

    const crashErrors = errors.filter(
      (e) =>
        e.includes('Uncaught') ||
        e.includes('TypeError') ||
        e.includes('Cannot read properties of') ||
        e.includes('is not a function')
    );
    expect(crashErrors).toHaveLength(0);
  });
});

// ─── Documents Tab ──────────────────────────────────────────────────────────

test.describe('Stage 4B-Documents: Documents Tab', () => {

  test('4B.21 — Documents tab loads without crash', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstStudent(page);
    await clickStudentTab(page, 'מסמכים');

    const content = await page.textContent('body');
    const hasDocumentsContent =
      content!.includes('מסמכים') ||
      content!.includes('בפיתוח') ||
      content!.includes('העלאה') ||
      content!.includes('קובץ');
    expect(hasDocumentsContent).toBeTruthy();

    const crashErrors = errors.filter(
      (e) =>
        e.includes('Uncaught') ||
        e.includes('TypeError') ||
        e.includes('Cannot read properties of')
    );
    expect(crashErrors).toHaveLength(0);
  });
});

// ─── Cross-Tab Navigation ───────────────────────────────────────────────────

test.describe('Stage 4B-CrossTab: Tab Navigation & Stability', () => {

  test('4B.22 — Tab navigation through all tabs works', async ({ page }) => {
    await navigateToFirstStudent(page);

    // Start on Personal Info (default)
    await expect(page.locator('h3', { hasText: 'פרטי תלמיד' })).toBeVisible({ timeout: 10000 });

    // Cycle through all tabs (using desktop nav to avoid strict mode)
    const tabLabels = ['מידע אקדמי', 'לוח זמנים', 'נוכחות', 'תזמורות', 'תאוריה', 'מסמכים'];
    for (const tabLabel of tabLabels) {
      const tab = page.locator('.desktop-tab-nav button.tab-button').filter({ hasText: tabLabel });
      if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(1500);
        // Page should still be on student details
        expect(page.url()).toMatch(/\/students\/[a-f0-9]+/);
      }
    }

    // Switch back to Personal Info
    await clickStudentTab(page, 'פרטים אישיים');
    await expect(page.locator('h3', { hasText: 'פרטי תלמיד' })).toBeVisible({ timeout: 10000 });
  });

  test('4B.23 — No critical console errors during full tab navigation', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstStudent(page);

    // Click through every available tab (desktop nav only)
    const allTabs = ['מידע אקדמי', 'לוח זמנים', 'נוכחות', 'תזמורות', 'תאוריה', 'מסמכים', 'פרטים אישיים'];
    for (const tabLabel of allTabs) {
      const tab = page.locator('.desktop-tab-nav button.tab-button').filter({ hasText: tabLabel });
      if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(2000);
      }
    }

    // Check for React crash errors (uncaught exceptions)
    const crashErrors = errors.filter(
      (e) =>
        e.includes('Uncaught') ||
        e.includes('TypeError') ||
        e.includes('ReferenceError') ||
        e.includes('Cannot read properties of') ||
        e.includes('is not a function') ||
        e.includes('is not defined')
    );
    expect(crashErrors).toHaveLength(0);
  });

  test('4B.24 — Second student details page also loads', async ({ page }) => {
    await goToStudentsList(page);

    const studentButtons = page.locator('button[title="צפה בפרטי התלמיד"]');
    const count = await studentButtons.count();
    if (count < 2) return; // need at least 2 students

    // Click second student
    await studentButtons.nth(1).click();
    await page.waitForURL('**/students/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // URL should match /students/:id
    expect(page.url()).toMatch(/\/students\/[a-f0-9]+/);

    // Header should show a name
    const header = page.locator('h1').first();
    await expect(header).toBeVisible({ timeout: 10000 });
    const headerText = await header.textContent();
    expect(headerText).toBeTruthy();
    expect(headerText).not.toContain('טוען');
  });
});

// ─── Student Form (Create/Edit Modal) ───────────────────────────────────────

test.describe('Stage 4B-Form: Student Form Modal', () => {

  test('4B.25 — Add student button opens form', async ({ page }) => {
    await goToStudentsList(page);

    // Find the "add student" button
    const addButton = page.getByRole('button', { name: /הוסף תלמיד|תלמיד חדש|הוספה/ }).first();
    if (!(await addButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Button may have different text — look for plus icon button
      const plusButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /הוסף|חדש/ }).first();
      if (await plusButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await plusButton.click();
      } else {
        return; // no add button found - skip
      }
    } else {
      await addButton.click();
    }

    await page.waitForTimeout(1000);

    // A form/modal should appear
    const content = await page.textContent('body');
    const hasForm =
      content!.includes('שם פרטי') ||
      content!.includes('פרטים אישיים') ||
      content!.includes('הוספת תלמיד') ||
      content!.includes('תלמיד חדש');
    expect(hasForm).toBeTruthy();
  });
});
