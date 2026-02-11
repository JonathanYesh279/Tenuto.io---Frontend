import { test, expect } from '@playwright/test';

// Auth tests need to start WITHOUT pre-loaded auth state
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Stage 1: Authentication', () => {
  test('1.1 — Login page loads', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('כניסה');

    // Page should be RTL (set via CSS direction)
    const direction = await page.locator('body').evaluate((el) => getComputedStyle(el).direction);
    expect(direction).toBe('rtl');
  });

  test('1.2 — Failed login shows error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#email', 'wrong@email.com');
    await page.fill('#password', 'wrongpass');
    await page.click('button[type="submit"]');

    // Wait for error message to appear
    const errorBox = page.locator('[class*="bg-red"]');
    await expect(errorBox.first()).toBeVisible({ timeout: 10000 });

    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('1.3 — Successful admin login', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#email', 'admin@tenuto-dev.com');
    await page.fill('#password', 'Admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');

    // Verify user is authenticated — role badge visible in sidebar
    await expect(page.locator('text=מנהל').first()).toBeVisible({ timeout: 10000 });
  });

  test('1.4 — Auth persists on refresh', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'admin@tenuto-dev.com');
    await page.fill('#password', 'Admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should stay on dashboard, not redirect to login
    expect(page.url()).toContain('/dashboard');
  });

  test('1.5 — Logout works', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'admin@tenuto-dev.com');
    await page.fill('#password', 'Admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Click the avatar to open dropdown
    await page.locator('[class*="rounded-full"][class*="bg-indigo"]').first().click();

    // Click logout button
    await page.locator('button:has-text("יציאה")').click();

    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');

    // Trying to access dashboard should redirect back to login
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('1.6 — Super admin login', async ({ page }) => {
    await page.goto('/login');

    // Click super admin toggle
    await page.click('button:has-text("כניסת מנהל-על")');

    // Header should change
    await expect(page.locator('text=כניסת מנהל-על').first()).toBeVisible();

    // Fill credentials
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'Admin123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });
});
