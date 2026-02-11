import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    storageState: 'tests/e2e/.auth/admin.json',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  // Start dev server manually: npm run dev
});
