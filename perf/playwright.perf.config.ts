import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.PERF_BASE_URL ?? 'https://atlas.argonanalytics.org';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000, // 2 min per test — perf tests are slow
  retries: 0, // No retries — flaky perf numbers are misleading
  workers: 1, // Sequential — avoids resource contention skewing results
  fullyParallel: false,

  reporter: [
    ['list'],
    ['json', { outputFile: './reports/latest.json' }],
  ],

  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1920, height: 1080 },
    // Disable animations for consistent measurements
    launchOptions: {
      args: [
        '--disable-gpu-compositing',
        '--enable-precise-memory-info',
        '--js-flags=--expose-gc',
      ],
    },
  },

  projects: [
    {
      name: 'desktop',
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'chromebook',
      use: {
        viewport: { width: 1366, height: 768 },
      },
    },
  ],
});
