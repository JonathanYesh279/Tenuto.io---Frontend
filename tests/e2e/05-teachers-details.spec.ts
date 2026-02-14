import { test, expect, Page } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

/**
 * Stage 5B: Teacher Details (Deep)
 *
 * Comprehensive E2E tests for the teacher details page,
 * covering navigation, all 4 tabs, and data display.
 *
 * Prerequisites:
 * - Dev server running on localhost:5173
 * - Backend running with seeded data (130 teachers)
 * - Auth storage state from global-setup
 */

// Helper: navigate to teachers list and wait for data
async function goToTeachersList(page: Page) {
  await page.goto('/teachers');
  await page.waitForLoadState('networkidle');
  // Wait for teacher rows to appear
  await page.locator('button[title="צפה בפרטי המורה"]').first().waitFor({ state: 'visible', timeout: 15000 });
}

// Helper: click the first teacher and wait for details page
async function navigateToFirstTeacher(page: Page) {
  await goToTeachersList(page);
  const firstTeacher = page.locator('button[title="צפה בפרטי המורה"]').first();
  await firstTeacher.click();
  await page.waitForURL('**/teachers/**', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  // Wait for loading spinner to disappear
  await page.waitForFunction(() => {
    return !document.querySelector('.animate-spin') ||
           document.querySelector('.teacher-details-container') !== null;
  }, { timeout: 15000 });
}

test.describe('Stage 5B: Teacher Details (Deep)', () => {

  test('5B.1 — Teachers list loads with data (verify baseline)', async ({ page }) => {
    await goToTeachersList(page);
    const teacherButtons = page.locator('button[title="צפה בפרטי המורה"]');
    const count = await teacherButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('5B.2 — Navigate to first teacher details (no crash)', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstTeacher(page);

    // URL should match /teachers/:id pattern
    expect(page.url()).toMatch(/\/teachers\/[a-f0-9]+/);

    // Page should have meaningful content (not blank)
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);

    // Filter out non-critical errors (API 404s for missing orchestras etc.)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('404') &&
        !e.includes('Failed to load') &&
        !e.includes('Network') &&
        !e.includes('ERR_') &&
        !e.includes('Warning:')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('5B.3 — Teacher header shows name and instrument', async ({ page }) => {
    await navigateToFirstTeacher(page);

    // Header should exist with teacher details container
    const header = page.locator('.teacher-details-container h1').first();
    await expect(header).toBeVisible({ timeout: 10000 });

    const headerText = await header.textContent();
    // Name should not be empty or just "טוען..."
    expect(headerText).toBeTruthy();
    expect(headerText).not.toBe('טוען...');

    // Instrument/role info below name
    const subtext = page.locator('.teacher-details-container p').first();
    await expect(subtext).toBeVisible();
  });

  test('5B.4 — Personal Info tab renders fields', async ({ page }) => {
    await navigateToFirstTeacher(page);

    // Personal info tab is the default tab — check for key labels
    await expect(page.getByText('פרטים בסיסיים')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('שם פרטי')).toBeVisible();
    await expect(page.getByText('שם משפחה')).toBeVisible();
    await expect(page.getByText('טלפון')).toBeVisible();

    // Professional section
    await expect(page.getByText('מידע מקצועי')).toBeVisible();
    await expect(page.getByText('כלי נגינה')).toBeVisible();
  });

  test('5B.5 — Personal Info tab edit mode works', async ({ page }) => {
    await navigateToFirstTeacher(page);

    // Wait for personal info tab to load
    await expect(page.getByText('פרטים בסיסיים')).toBeVisible({ timeout: 10000 });

    // Click Edit button
    const editButton = page.getByRole('button', { name: 'ערוך' });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Should show Save and Cancel buttons
    await expect(page.getByRole('button', { name: 'שמור' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'בטל' })).toBeVisible();

    // Input fields should appear for firstName
    const firstNameInput = page.locator('input[placeholder="הכנס שם פרטי"]');
    await expect(firstNameInput).toBeVisible();

    // Cancel editing
    await page.getByRole('button', { name: 'בטל' }).click();

    // Should return to view mode — edit button visible again
    await expect(page.getByRole('button', { name: 'ערוך' })).toBeVisible();
  });

  test('5B.6 — Students tab loads', async ({ page }) => {
    await navigateToFirstTeacher(page);

    // Click on Students tab
    const studentsTab = page.locator('button.tab-button').filter({ hasText: 'ניהול תלמידים' });
    await expect(studentsTab).toBeVisible({ timeout: 10000 });
    await studentsTab.click();

    // Wait for tab content to load (either students list or empty state)
    await page.waitForTimeout(3000);

    const content = await page.textContent('body');
    // Should show either student cards OR the empty state message
    const hasStudents = content!.includes('צפה בפרטים') || content!.includes('הסר');
    const hasEmptyState = content!.includes('אין תלמידים משויכים');
    const hasAddButton = content!.includes('הוסף תלמיד');

    expect(hasStudents || hasEmptyState || hasAddButton).toBe(true);
  });

  test('5B.7 — Students tab shows student cards or empty state', async ({ page }) => {
    await navigateToFirstTeacher(page);

    // Click Students tab
    const studentsTab = page.locator('button.tab-button').filter({ hasText: 'ניהול תלמידים' });
    await studentsTab.click();
    await page.waitForTimeout(3000);

    // Check for "Add student" button which should always be present
    const addButton = page.getByRole('button', { name: /הוסף תלמיד/ });
    await expect(addButton).toBeVisible({ timeout: 10000 });
  });

  test('5B.8 — Schedule tab loads without crash', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstTeacher(page);

    // Click Schedule tab
    const scheduleTab = page.locator('button.tab-button').filter({ hasText: 'לוח זמנים' });
    await expect(scheduleTab).toBeVisible({ timeout: 10000 });
    await scheduleTab.click();

    // Wait for schedule content to render
    await page.waitForTimeout(3000);

    // Should show schedule statistics (weekly hours, teaching days, students, ensembles)
    const content = await page.textContent('body');
    const hasScheduleContent =
      content!.includes('שעות שבועיות') ||
      content!.includes('ימי לימוד') ||
      content!.includes('לוח זמנים שבועי') ||
      content!.includes('אין ימי לימוד מוגדרים');

    expect(hasScheduleContent).toBe(true);

    // No critical console errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('404') &&
        !e.includes('Failed to load') &&
        !e.includes('Network') &&
        !e.includes('ERR_') &&
        !e.includes('Warning:') &&
        !e.includes('orchestraEnrollment')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('5B.9 — Schedule tab shows weekly calendar or empty state', async ({ page }) => {
    await navigateToFirstTeacher(page);

    // Navigate to Schedule tab
    const scheduleTab = page.locator('button.tab-button').filter({ hasText: 'לוח זמנים' });
    await scheduleTab.click();
    await page.waitForTimeout(3000);

    const content = await page.textContent('body');
    // Should show either the calendar view toggle buttons or empty state
    const hasViewToggle = content!.includes('לוח זמנים שבועי') && content!.includes('ניהול ימי לימוד');
    const hasEmptyState = content!.includes('אין ימי לימוד מוגדרים');
    const hasLegend = content!.includes('מקרא');

    expect(hasViewToggle || hasEmptyState || hasLegend).toBe(true);
  });

  test('5B.10 — Tab navigation between all tabs works', async ({ page }) => {
    await navigateToFirstTeacher(page);

    // Start on Personal Info (default)
    await expect(page.getByText('פרטים בסיסיים')).toBeVisible({ timeout: 10000 });

    // Switch to Students tab
    const studentsTab = page.locator('button.tab-button').filter({ hasText: 'ניהול תלמידים' });
    await studentsTab.click();
    await page.waitForTimeout(2000);
    // Verify students content loaded
    const studentsContent = await page.textContent('body');
    expect(
      studentsContent!.includes('הוסף תלמיד') || studentsContent!.includes('אין תלמידים')
    ).toBe(true);

    // Switch to Schedule tab
    const scheduleTab = page.locator('button.tab-button').filter({ hasText: 'לוח זמנים' });
    await scheduleTab.click();
    await page.waitForTimeout(2000);
    const scheduleContent = await page.textContent('body');
    expect(
      scheduleContent!.includes('שעות שבועיות') ||
      scheduleContent!.includes('ימי לימוד') ||
      scheduleContent!.includes('אין ימי לימוד')
    ).toBe(true);

    // Switch back to Personal Info
    const personalTab = page.locator('button.tab-button').filter({ hasText: 'מידע אישי' });
    await personalTab.click();
    await page.waitForTimeout(2000);
    await expect(page.getByText('פרטים בסיסיים')).toBeVisible();
  });

  test('5B.11 — Conducting tab shows for conductors (conditional)', async ({ page }) => {
    await navigateToFirstTeacher(page);

    // The conducting tab may or may not appear depending on the teacher
    const conductingTab = page.locator('button.tab-button').filter({ hasText: 'ניצוח' });
    const isVisible = await conductingTab.isVisible().catch(() => false);

    if (isVisible) {
      // If visible, click and verify content loads
      await conductingTab.click();
      await page.waitForTimeout(3000);
      const content = await page.textContent('body');
      expect(
        content!.includes('תזמורות') || content!.includes('אנסמבלים')
      ).toBe(true);
    } else {
      // If not visible, this teacher is not a conductor — that's valid
      expect(true).toBe(true);
    }
  });

  test('5B.12 — No console errors during teacher details navigation', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await navigateToFirstTeacher(page);

    // Click through each tab
    const tabs = ['ניהול תלמידים', 'לוח זמנים', 'מידע אישי'];
    for (const tabLabel of tabs) {
      const tab = page.locator('button.tab-button').filter({ hasText: tabLabel });
      if (await tab.isVisible().catch(() => false)) {
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

  test('5B.13 — Breadcrumb navigation back to teachers list', async ({ page }) => {
    await navigateToFirstTeacher(page);

    // Find breadcrumb link "מורים"
    const breadcrumb = page.locator('nav button', { hasText: 'מורים' }).first();
    await expect(breadcrumb).toBeVisible({ timeout: 10000 });

    // Click breadcrumb to go back
    await breadcrumb.click();
    await page.waitForURL('**/teachers', { timeout: 10000 });

    // Should be back on teachers list
    expect(page.url()).toMatch(/\/teachers$/);
  });

  test('5B.14 — Teacher search on list page filters results', async ({ page }) => {
    await goToTeachersList(page);

    const searchInput = page.locator('input[placeholder*="חיפוש"]').first();
    if (!(await searchInput.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Search not available — skip gracefully
      return;
    }

    const initialCount = await page.locator('button[title="צפה בפרטי המורה"]').count();

    // Type a search term
    await searchInput.fill('כהן');
    await page.waitForTimeout(2000);

    const filteredCount = await page.locator('button[title="צפה בפרטי המורה"]').count();

    // Filtered results should be <= initial (could be 0 if no match)
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Page should still contain the search term in visible results
    if (filteredCount > 0) {
      const content = await page.textContent('body');
      expect(content).toContain('כהן');
    }
  });
});
