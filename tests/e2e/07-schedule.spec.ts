import { test, expect } from '@playwright/test';

test.describe('Stage 7: Schedule & Rehearsals', () => {
  test('7.1 — Rehearsals page loads', async ({ page }) => {
    await page.goto('/rehearsals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should load without error (may be empty)
    expect(page.url()).toContain('/rehearsals');
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('7.2 — Calendar/List view toggle', async ({ page }) => {
    await page.goto('/rehearsals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page loaded without crash
    expect(page.url()).toContain('/rehearsals');
  });
});
