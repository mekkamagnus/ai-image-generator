import { test, expect } from '@playwright/test';

/**
 * Happy Path E2E Test
 *
 * Tests the complete successful image generation workflow:
 * 1. Navigate to app
 * 2. Enter prompt
 * 3. Click generate
 * 4. Wait for image (120s timeout for DashScope API)
 * 5. Verify image and buttons appear
 * 6. Verify console logs
 *
 * WHY 120 second timeout:
 * - DashScope API takes 1-2 minutes for image generation
 * - Playwright default 30s timeout is too short
 * - 120s gives buffer for slow API responses
 */

test.describe('Happy Path - Successful Image Generation', () => {
  test('should complete full workflow from prompt to image display', async ({ page }) => {
    // Collect console logs for validation
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log('[Browser Console]', msg.type(), msg.text());
    });

    // Step 1: Navigate to app
    await page.goto('/');

    // Step 2: Verify page loaded
    await expect(page.locator('h1')).toContainText('AI Image Generator');
    await expect(page.locator('textarea[placeholder*="Enter your image prompt"]')).toBeVisible();

    // Step 3: Enter test prompt
    const testPrompt = 'a beautiful sunset over mountains';
    await page.fill('textarea[placeholder*="Enter your image prompt"]', testPrompt);

    // Step 4: Click generate button
    const generateButton = page.locator('button:has-text("Generate Image")');
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    // Step 5: Verify button text changes to "Starting..."
    await expect(page.locator('button:has-text("Starting...")')).toBeVisible();

    // Step 6: Verify button text changes to "Generating..."
    await expect(page.locator('button:has-text("Generating...")')).toBeVisible();

    // Step 7: Verify processing status appears
    await expect(page.locator('text=Generating your image')).toBeVisible();

    // Step 8: Wait for image to appear (120s timeout for DashScope API)
    console.log('[Test] Waiting for image generation (max 120s)...');
    const imageElement = page.locator('img[alt="Generated image"]');

    try {
      await imageElement.waitFor({ state: 'visible', timeout: 120000 });
      console.log('[Test] Image generated successfully!');
    } catch (error) {
      console.error('[Test] Image generation timed out after 120s');
      console.log('[Test] Console logs captured:', consoleLogs);
      throw error;
    }

    // Step 9: Verify image is visible
    await expect(imageElement).toBeVisible();

    // Step 10: Verify Download button appears
    await expect(page.locator('a:has-text("Download Image")')).toBeVisible();

    // Step 11: Verify Start Over button appears
    await expect(page.locator('button:has-text("Start Over")')).toBeVisible();

    // Step 12: Verify no error message displayed
    await expect(page.locator('text=Error:')).not.toBeVisible();

    // Step 13: Verify console logs contain [Image Generation] lifecycle logs
    const logText = consoleLogs.join('\n');
    expect(logText).toContain('[Image Generation]');
    expect(logText).toContain('task_created');
    expect(logText).toContain('task_succeeded');
  });

  test('should allow generating another image after completion', async ({ page }) => {
    // Step 1: Complete first generation (skip if already done)
    await page.goto('/');

    // Enter prompt and generate
    await page.fill('textarea[placeholder*="Enter your image prompt"]', 'a red apple');
    await page.click('button:has-text("Generate Image")');

    // Wait for image (120s timeout)
    await page.locator('img[alt="Generated image"]').waitFor({ state: 'visible', timeout: 120000 });

    // Step 2: Verify button changed to "Generate Another"
    await expect(page.locator('button:has-text("Generate Another")')).toBeVisible();

    // Step 3: Click "Start Over" to reset
    await page.click('button:has-text("Start Over")');

    // Step 4: Verify image disappeared
    await expect(page.locator('img[alt="Generated image"]')).not.toBeVisible();

    // Step 5: Verify prompt cleared
    await expect(page.locator('textarea[placeholder*="Enter your image prompt"]')).toHaveValue('');

    // Step 6: Verify button back to "Generate Image"
    await expect(page.locator('button:has-text("Generate Image")')).toBeVisible();

    // Step 7: Verify can enter new prompt and generate again
    await page.fill('textarea[placeholder*="Enter your image prompt"]', 'a blue ocean');
    await page.click('button:has-text("Generate Image")');
    await expect(page.locator('button:has-text("Starting...")')).toBeVisible();
  });
});
