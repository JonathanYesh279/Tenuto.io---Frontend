import { test, expect } from '@playwright/test';

test.describe('Stage 9: Bagruts', () => {
  test('9.1 — Bagruts page loads', async ({ page }) => {
    await page.goto('/bagruts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/bagruts');
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
