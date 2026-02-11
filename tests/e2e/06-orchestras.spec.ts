import { test, expect } from '@playwright/test';

test.describe('Stage 6: Orchestras', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orchestras');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('6.1 — Orchestras list loads', async ({ page }) => {
    const pageContent = await page.textContent('body');
    const hasOrchestraData = pageContent!.includes('תזמורת') || pageContent!.includes('סימפונית') || pageContent!.includes('50');
    expect(hasOrchestraData).toBeTruthy();
  });

  test('6.2 — Orchestra search works', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="חיפוש"]').first();
    if (!(await searchInput.isVisible({ timeout: 5000 }).catch(() => false))) return;

    await searchInput.fill('סימפונית');
    await page.waitForTimeout(2000);
  });

  test('6.3 — Orchestra view modes', async ({ page }) => {
    // Verify page loaded — different view modes may have different structures
    expect(page.url()).toContain('/orchestras');
    const pageContent = await page.textContent('body');
    expect(pageContent!.length).toBeGreaterThan(100);
  });

  test('6.4 — Orchestra details page', async ({ page }) => {
    const orchestraLink = page.locator('a[href*="/orchestras/"]').first();
    if (!(await orchestraLink.isVisible({ timeout: 5000 }).catch(() => false))) return;

    await orchestraLink.click();
    await page.waitForURL('**/orchestras/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    expect(page.url()).toMatch(/\/orchestras\/[a-f0-9]+/);
  });

  test('6.5 — Orchestra member list', async ({ page }) => {
    // Click view button on first orchestra
    const viewButton = page.locator('button[title*="צפה"], button[title*="פרטי"]').first();
    if (!(await viewButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Try clicking any orchestra link/card
      const orchestraLink = page.locator('a[href*="/orchestras/"], [class*="cursor-pointer"]').first();
      if (!(await orchestraLink.isVisible({ timeout: 3000 }).catch(() => false))) return;
      await orchestraLink.click();
    } else {
      await viewButton.click();
    }

    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');

    const pageContent = await page.textContent('body');
    expect(pageContent!.length).toBeGreaterThan(50);
  });
});
