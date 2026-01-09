import { test, expect } from '@playwright/test';
import {
  mockSuccessfulImageGeneration,
  setupTestMocks,
  MOCK_IMAGE_URL,
} from './helpers/api-mocks';

/**
 * Happy Path E2E Test
 *
 * Tests the complete successful image generation workflow using mocked API responses:
 * 1. Navigate to app
 * 2. Enter prompt
 * 3. Click generate
 * 4. Wait for image (fast with mocked API)
 * 5. Verify image and buttons appear
 * 6. Verify console logs
 *
 * WHY use mocking:
 * - Tests run in seconds instead of minutes
 * - No API quota consumption
 * - Reliable, deterministic results
 * - Works without API credentials
 */

test.describe('Happy Path - Successful Image Generation', () => {
  test('should complete full workflow from prompt to image display', async ({ page }) => {
    // Setup test mocks
    await setupTestMocks(page);
    await mockSuccessfulImageGeneration(page);

    // Collect console logs for validation
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
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

    // Step 5: Wait for image to appear (fast with mocked API - ~2s instead of 120s)
    console.log('[Test] Waiting for image generation (mocked API)...');
    const imageElement = page.locator('img[alt="Generated image"]');

    try {
      await imageElement.waitFor({ state: 'visible', timeout: 10000 });
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
    expect(logText).toContain('task_succeeded');
    expect(logText).toContain('synchronous'); // Verify using synchronous mode
  });

  test('should allow generating another image after completion', async ({ page }) => {
    // Setup test mocks
    await setupTestMocks(page);
    await mockSuccessfulImageGeneration(page);

    // Step 1: Complete first generation
    await page.goto('/');

    // Enter prompt and generate
    await page.fill('textarea[placeholder*="Enter your image prompt"]', 'a red apple');
    await page.click('button:has-text("Generate Image")');

    // Wait for image (fast with mocked API - 10s timeout instead of 120s)
    await page.locator('img[alt="Generated image"]').waitFor({ state: 'visible', timeout: 10000 });

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

    // Wait for second image generation
    await page.locator('img[alt="Generated image"]').waitFor({ state: 'visible', timeout: 10000 });
  });
});
