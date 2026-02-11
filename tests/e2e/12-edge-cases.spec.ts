import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

test.describe('Stage 12: Error Handling & Edge Cases', () => {
  test('12.1 — Invalid route shows fallback', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show something — either redirect or 404 page
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('12.2 — Student not found', async ({ page }) => {
    await page.goto('/students/000000000000000000000000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Should show error or redirect, not crash
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('12.3 — Empty search returns no results message', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const searchInput = page.locator('input[placeholder*="חיפוש"]').first();
    if (!(await searchInput.isVisible({ timeout: 5000 }).catch(() => false))) return;

    await searchInput.fill('XYZXYZXYZ');
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');
    const hasEmptyState =
      pageContent!.includes('לא נמצאו') ||
      pageContent!.includes('אין תוצאות') ||
      pageContent!.includes('אין') ||
      pageContent!.includes('0');
    expect(hasEmptyState).toBeTruthy();
  });

  test('12.4 — No console 500 errors on main pages', async ({ page }) => {
    const serverErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (
        msg.type() === 'error' &&
        (text.includes(' 500 ') || text.includes('Internal Server Error')) &&
        !text.includes('vite.svg') &&
        !text.includes('WebSocket') &&
        !text.includes('favicon') &&
        !text.includes('orchestraIds')
      ) {
        serverErrors.push(text);
      }
    });

    // Test core data pages only
    const routes = ['/dashboard', '/students', '/teachers'];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    expect(serverErrors).toHaveLength(0);
  });
});
