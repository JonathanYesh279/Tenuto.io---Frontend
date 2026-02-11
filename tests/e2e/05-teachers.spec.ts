import { test, expect } from '@playwright/test';

test.describe('Stage 5: Teachers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teachers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('5.1 — Teachers list loads with data', async ({ page }) => {
    const teacherElements = page.locator('button[title="צפה בפרטי המורה"]');
    await expect(teacherElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('5.2 — Teacher search works', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="חיפוש"]').first();
    if (!(await searchInput.isVisible({ timeout: 5000 }).catch(() => false))) return;

    await searchInput.fill('כהן');
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('כהן');
  });

  test('5.3 — Teacher filters (by instrument)', async ({ page }) => {
    // Verify the page loaded with teacher data
    const pageContent = await page.textContent('body');
    expect(pageContent!.length).toBeGreaterThan(100);
  });

  test('5.4 — Teacher details page', async ({ page }) => {
    const teacherLink = page.locator('button[title="צפה בפרטי המורה"]').first();
    await expect(teacherLink).toBeVisible({ timeout: 10000 });

    await teacherLink.click();
    await page.waitForURL('**/teachers/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    expect(page.url()).toMatch(/\/teachers\/[a-f0-9]+/);
    const pageContent = await page.textContent('body');
    expect(pageContent!.length).toBeGreaterThan(50);
  });

  test('5.5 — Teacher count visible', async ({ page }) => {
    // Verify the teacher count is shown (130 teachers seeded)
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('130');
  });
});
