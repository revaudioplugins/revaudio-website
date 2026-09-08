import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Real WebKit at a real iPhone viewport. Everything else here is Blink,
    // while the two things Dan actually reviews on — the iOS Simulator and his
    // phone — are WebKit, so nothing automated agreed with them. Note this
    // still cannot judge `backdrop-filter`: headless WebKit reports the filter
    // in computed style but never composites it. Glass is a device check.
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14 Pro'] },
      // trial-gate-mobile drives both legs itself: it sets an iPhone context
      // for the touch leg and relies on the *project* being a desktop one for
      // the "mobile note hidden" leg. Running it on a phone project makes that
      // second assertion contradict itself, so it stays on chromium.
      testIgnore: /trial-gate-mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
