import { test, expect } from '@playwright/test';

test.describe('Stage 2: Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('2.1 — Sidebar renders all admin menu items', async ({ page }) => {
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    const menuItems = [
      'תלמידים',
      'מורים',
      'תזמורות',
      'חזרות',
      'שיעורי תיאוריה',
      'בגרויות',
      'דוחות משרד',
      'ייבוא נתונים',
      'הגדרות',
    ];

    for (const item of menuItems) {
      await expect(sidebar.locator(`text=${item}`).first()).toBeVisible();
    }
  });

  test('2.2 — Navigation links work', async ({ page }) => {
    const routes = [
      { label: 'תלמידים', path: '/students' },
      { label: 'מורים', path: '/teachers' },
      { label: 'תזמורות', path: '/orchestras' },
      { label: 'חזרות', path: '/rehearsals' },
      { label: 'שיעורי תיאוריה', path: '/theory-lessons' },
      { label: 'בגרויות', path: '/bagruts' },
      { label: 'דוחות משרד', path: '/ministry-reports' },
      { label: 'ייבוא נתונים', path: '/import' },
      { label: 'הגדרות', path: '/settings' },
    ];

    for (const route of routes) {
      await page.locator(`#sidebar a:has-text("${route.label}")`).first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(route.path);
      await expect(page.locator('main, [role="main"], .min-h-screen').first()).toBeVisible();
    }
  });

  test('2.3 — Page title/header updates per route', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=תלמידים').first()).toBeVisible();

    await page.goto('/teachers');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=מורים').first()).toBeVisible();

    await page.goto('/orchestras');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=תזמורות').first()).toBeVisible();
  });
});
