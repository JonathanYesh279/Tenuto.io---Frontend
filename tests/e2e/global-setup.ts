import { chromium, FullConfig } from '@playwright/test';

const STORAGE_STATE_PATH = 'tests/e2e/.auth/admin.json';
const SUPER_ADMIN_STATE_PATH = 'tests/e2e/.auth/super-admin.json';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5173';

  const browser = await chromium.launch();

  // --- Admin login ---
  const adminPage = await browser.newPage();
  await adminPage.goto(`${baseURL}/login`, { timeout: 60000 });
  await adminPage.fill('#email', 'admin@tenuto-dev.com');
  await adminPage.fill('#password', 'Admin123');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL('**/dashboard', { timeout: 30000 });
  await adminPage.context().storageState({ path: STORAGE_STATE_PATH });
  await adminPage.close();

  // --- Super admin login ---
  const superPage = await browser.newPage();
  await superPage.goto(`${baseURL}/login`, { timeout: 60000 });
  await superPage.click('button:has-text("כניסת מנהל-על")');
  await superPage.fill('#email', 'admin@example.com');
  await superPage.fill('#password', 'Admin123');
  await superPage.click('button[type="submit"]');
  await superPage.waitForURL('**/dashboard', { timeout: 30000 });
  await superPage.context().storageState({ path: SUPER_ADMIN_STATE_PATH });
  await superPage.close();

  await browser.close();
}

export default globalSetup;
