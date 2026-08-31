import { defineConfig, devices } from '@playwright/test';

/**
 * Tests run against a real production build, not the dev server, so they catch
 * anything that only goes wrong once the site is bundled.
 */
/**
 * The test server runs on its own port so `npm run dev` can stay up while the
 * suite runs. Override with TEST_PORT if 4322 is taken.
 */
const PORT = Number(process.env.TEST_PORT ?? 4322);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],

  webServer: {
    command: `npm run build && npm run serve -- ${PORT}`,
    url: `http://localhost:${PORT}`,
    // Always build first. Reusing a running preview once hid a fix from the
    // suite and reported a stale failure, which is worse than a slower run.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
