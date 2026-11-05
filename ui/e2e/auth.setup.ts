import { test as setup } from '@playwright/test'

/**
 * Exchanges PLAYWRIGHT_TOKEN for a session cookie once and persists the storage
 * state, so the token never appears in a test's trace. Kiro Crew's own E2E setup,
 * reduced to what this spec needs.
 */
export const STATE_PATH = process.env.PLAYWRIGHT_STORAGE_STATE || 'e2e/.auth/state.json'

setup('authenticate', async ({ page }) => {
  const token = process.env.PLAYWRIGHT_TOKEN
  if (token) {
    await page.goto(`/?token=${encodeURIComponent(token)}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForLoadState('load', { timeout: 30000 })
    // Skip the first-run look picker, which would overlay every page.
    await page.evaluate(() => window.localStorage.setItem('mc-onboarded', '1'))
  }
  await page.context().storageState({ path: STATE_PATH })
})
