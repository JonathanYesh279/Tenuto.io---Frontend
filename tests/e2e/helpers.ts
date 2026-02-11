import { Page } from '@playwright/test';

/**
 * Login as admin — only needed for tests that start unauthenticated
 * (e.g. login page tests, logout tests).
 * Most tests should use the shared storageState from global-setup instead.
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('#email', 'admin@tenuto-dev.com');
  await page.fill('#password', 'Admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

export async function loginAsSuperAdmin(page: Page) {
  await page.goto('/login');
  await page.click('button:has-text("כניסת מנהל-על")');
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'Admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      !msg.text().includes('vite.svg') &&
      !msg.text().includes('WebSocket') &&
      !msg.text().includes('favicon')
    ) {
      errors.push(msg.text());
    }
  });
  return errors;
}
