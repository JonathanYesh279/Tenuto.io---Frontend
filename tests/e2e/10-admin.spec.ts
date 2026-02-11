import { test, expect } from '@playwright/test';

test.describe('Stage 10: Admin Pages', () => {
  test('10.1 — Settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(page.url()).toContain('/settings');

    const pageContent = await page.textContent('body');
    const hasSettingsContent =
      pageContent!.includes('תל אביב') ||
      pageContent!.includes('קונסרבטוריון') ||
      pageContent!.includes('הגדרות');
    expect(hasSettingsContent).toBeTruthy();
  });

  test('10.2 — Ministry reports page loads', async ({ page }) => {
    await page.goto('/ministry-reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(page.url()).toContain('/ministry-reports');
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('10.3 — Import page loads', async ({ page }) => {
    await page.goto('/import');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(page.url()).toContain('/import');
    const pageContent = await page.textContent('body');
    const hasImportContent =
      pageContent!.includes('מורים') || pageContent!.includes('תלמידים') || pageContent!.includes('ייבוא');
    expect(hasImportContent).toBeTruthy();
  });

  test('10.4 — Settings can be edited (read-only check)', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const inputs = page.locator('input:not([type="hidden"]):not([disabled])');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });
});
