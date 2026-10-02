const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: 'earn-browser.spec.cjs',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 7000 },
  reporter: 'list',
  use: {
    baseURL: process.env.EARN_TEST_BASE_URL || 'http://localhost:3001',
    viewport: { width: 1440, height: 1000 },
    headless: true,
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
  },
});
