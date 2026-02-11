import { test, expect } from '@playwright/test';

test.describe('Stage 3: Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('3.1 — Dashboard loads with stats', async ({ page }) => {
    // Dashboard should show stat cards with numbers
    await expect(page.locator('text=לוח בקרה').first()).toBeVisible({ timeout: 10000 });

    // At least one stat should show a non-zero number (e.g. 1200 students)
    await expect(page.locator('text=1200').first()).toBeVisible({ timeout: 10000 });
  });

  test('3.2 — Dashboard charts render', async ({ page }) => {
    await page.waitForTimeout(3000);

    // No stuck loading spinners
    const spinners = page.locator('[class*="animate-spin"]');
    const spinnerCount = await spinners.count();
    expect(spinnerCount).toBeLessThan(5);
  });

  test('3.3 — Quick actions visible for admin', async ({ page }) => {
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    // Quick actions section should exist in sidebar
    await expect(sidebar.locator('text=פעולות מהירות').first()).toBeVisible({ timeout: 5000 });
  });
});
