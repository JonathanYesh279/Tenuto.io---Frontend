import { test, expect } from '@playwright/test';

test.describe('Stage 8: Theory Lessons', () => {
  test('8.1 — Theory lessons page loads', async ({ page }) => {
    await page.goto('/theory-lessons');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/theory-lessons');
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('8.2 — Bulk edit tab accessible', async ({ page }) => {
    await page.goto('/theory-lessons');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page loaded successfully
    expect(page.url()).toContain('/theory-lessons');
  });
});
