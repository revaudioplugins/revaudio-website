// Playwright config for the WIDE BEAM gates: the worktree's tests, baseURL from BASE_URL, NO webServer (nobody builds), plus a Firefox project the
// house config does not have. WB_DEV_NOISE=1 turns on the filter for the Astro dev toolbar's 403 (a dev server only).
//   BASE_URL=http://127.0.0.1:4517 npx playwright test -c <this file> [tests/widebeam.spec.ts]
const { defineConfig, devices } = require(process.env.WB_PW || require('path').resolve(__dirname, '..', '..', 'node_modules', '@playwright', 'test'));
const REPO = process.env.WB_REPO || require('path').resolve(__dirname, '..', '..');
process.env.WB_DEV_NOISE = process.env.WB_DEV_NOISE ?? '1';
module.exports = defineConfig({
  testDir: REPO + '/tests',
  testMatch: /(widebeam|smoke)\.spec\.ts/,
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list']],
  timeout: 60000,
  use: { baseURL: process.env.BASE_URL, trace: 'off' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14 Pro'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
