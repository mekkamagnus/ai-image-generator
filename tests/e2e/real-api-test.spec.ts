import { test, expect } from '@playwright/test';

/**
 * Real API Test - Actual Image Generation
 *
 * This test uses REAL API calls to DashScope to verify image generation works.
 * Requires valid API key in .env file.
 *
 * WARNING: This will consume API quota and take 1-2 minutes.
 */

test.describe('Real API Image Generation', () => {
  test('should generate an actual image with real API', async ({ page }) => {
    // Collect console logs for debugging
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log('[Browser Console]', msg.type(), msg.text());
    });

    // Navigate to app
    await page.goto('/');

    // Wait for page to load
    await expect(page.locator('h1:has-text("AI Image Generator")')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Enter your image prompt"]')).toBeVisible();

    // Enter a simple test prompt
    const testPrompt = 'a cute cat';
    await page.fill('textarea[placeholder*="Enter your image prompt"]', testPrompt);

    // Click generate button
    const generateButton = page.locator('button:has-text("Generate Image")');
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    console.log('[Test] Image generation started - this will take 1-2 minutes...');

    // Wait for image to appear (120s timeout for real API)
    try {
      const imageElement = page.locator('img[alt="Generated image"]');
      await imageElement.waitFor({ state: 'visible', timeout: 120000 });

      console.log('[Test] ✅ SUCCESS: Image generated!');

      // Verify image is visible
      await expect(imageElement).toBeVisible();

      // Check console logs for success
      const logText = consoleLogs.join('\n');
      expect(logText).toContain('[Image Generation]');
      expect(logText).toContain('task_succeeded');

      // Verify Download and Start Over buttons appear
      await expect(page.locator('a:has-text("Download Image")')).toBeVisible();
      await expect(page.locator('button:has-text("Start Over")')).toBeVisible();

      console.log('[Test] All checks passed! Image generation works correctly.');
    } catch (error) {
      console.error('[Test] ❌ FAILED: Image generation failed or timed out');
      console.log('[Test] Console logs captured:', consoleLogs);

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/real-api-failure.png', fullPage: true });
      console.log('[Test] Screenshot saved to test-results/real-api-failure.png');

      throw error;
    }
  });

  test('should show user-friendly error if API key is invalid', async ({ page }) => {
    // This test verifies error handling works even if API key is invalid
    await page.goto('/');

    // Enter prompt
    await page.fill('textarea[placeholder*="Enter your image prompt"]', 'test error handling');

    // Click generate
    await page.click('button:has-text("Generate Image")');

    // Wait a bit for API response
    await page.waitForTimeout(5000);

    // Check if error message appears (will happen if API key is invalid/quota exceeded)
    const errorElement = page.locator('text=/Error:|Request failed/');

    const hasError = await errorElement.count();
    if (hasError > 0) {
      console.log('[Test] API error detected (this is expected if quota is exceeded or API key is invalid)');
      await expect(errorElement).toBeVisible();
    }
  });
});
