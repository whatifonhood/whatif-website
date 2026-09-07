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
  retries: process.env.CI ? 2 : 0,
  /*
   * Firefox on a loaded GitHub runner sometimes takes over 30 seconds just to
   * land on a page — the same test passes alone in two. That is the runner, not
   * the site, so on CI the budget is doubled rather than the test loosened; a
   * genuine hang still fails, at 60 seconds instead of 30.
   */
  timeout: process.env.CI ? 60_000 : 30_000,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    navigationTimeout: process.env.CI ? 45_000 : undefined,
  },

  /*
   * Three engines, because the site has to work in all of them.
   *
   * `desktop` is Blink, `mobile` is WebKit — which is what every iPhone runs,
   * whatever browser is installed on it — and `firefox` is Gecko. Two engines
   * agreeing proves nothing about the third: the site's own tools menu once
   * opened only through `:has()`, which Gecko did not ship until Firefox 121,
   * and nothing in a Chrome-and-Safari suite could have noticed.
   */
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
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
