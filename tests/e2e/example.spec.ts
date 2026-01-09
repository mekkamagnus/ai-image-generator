// tests/e2e/example.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Example E2E Tests', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/')

    // Check that page title exists
    await expect(page).toHaveTitle(/AI Image Generator/)

    // Check that main elements are present
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()

    const button = page.locator('button:has-text("Generate")')
    await expect(button).toBeVisible()
  })

  test('shows validation when prompt is empty', async ({ page }) => {
    await page.goto('/')

    // Verify button is disabled when textarea is empty
    const button = page.locator('button:has-text("Generate")')
    await expect(button).toBeDisabled()

    // Verify textarea is visible
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await expect(textarea).toHaveValue('')
  })
})
