import { defineConfig, devices } from '@playwright/test'

// Browser checks against a live, isolated gateway with this app installed
// (`e2e/ops-mission-control.spec.ts` says how to run them). Not part of CI.
const STATE_PATH = process.env.PLAYWRIGHT_STORAGE_STATE || 'e2e/.auth/state.json'

export default defineConfig({
  testDir: './e2e',
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      testMatch: /\.spec\.ts$/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: STATE_PATH },
    },
  ],
})
