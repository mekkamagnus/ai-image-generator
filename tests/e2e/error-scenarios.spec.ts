import { test, expect } from '@playwright/test';

/**
 * Error Scenarios E2E Tests
 *
 * Tests error handling, validation, and retry functionality:
 * 1. Empty prompt validation
 * 2. API error display (with mocking)
 * 3. Retry button functionality
 * 4. Download button
 * 5. Start over button
 *
 * Uses Playwright route mocking to simulate API errors without
 * hitting real DashScope API.
 */

test.describe('Error Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app before each test
    await page.goto('/');
  });

  test('should validate empty prompt and disable generate button', async ({ page }) => {
    // Verify button is disabled when prompt is empty
    const generateButton = page.locator('button:has-text("Generate Image")');
    await expect(generateButton).toBeDisabled();

    // Verify textarea is focused and empty
    const textarea = page.locator('textarea[placeholder*="Enter your image prompt"]');
    await expect(textarea).toBeEmpty();
    await expect(textarea).toBeFocused();

    // Enter space only (should still be disabled)
    await textarea.fill('   ');
    await expect(generateButton).toBeDisabled();

    // Enter single character (should enable)
    await textarea.fill('a');
    await expect(generateButton).toBeEnabled();
  });

  test('should display API error with user-friendly message', async ({ page }) => {
    // Mock API to return 400 Bad Request
    await page.route('**/api/qwen/generate', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'InvalidParameter',
          message: 'The prompt parameter is invalid',
          request_id: 'req-error-123'
        })
      });
    });

    // Enter prompt and click generate
    await page.fill('textarea[placeholder*="Enter your image prompt"]', 'test prompt');
    await page.click('button:has-text("Generate Image")');

    // Wait for error to appear
    await expect(page.locator('text=Error:')).toBeVisible();

    // Verify user-friendly error message
    await expect(page.locator('text=Error:')).toBeVisible();
    const errorElement = page.locator('.bg-destructive\\/10');
    await expect(errorElement).toContainText('Error:');

    // Verify suggestion appears (should have 💡 emoji)
    await expect(errorElement).toContainText('💡');
  });

  test('should show retry button for retryable errors and trigger retry', async ({ page }) => {
    let requestCount = 0;

    // Mock API to fail twice with rate limit, then succeed
    await page.route('**/api/qwen/generate', async route => {
      requestCount++;

      if (requestCount <= 2) {
        // Rate limit error (retryable)
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'RateLimitExceeded',
            message: 'Rate limit exceeded',
            request_id: 'req-rate-limit'
          })
        });
      } else {
        // Success after retries
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            output: {
              task_id: 'task-after-retry',
              task_status: 'PENDING'
            },
            request_id: 'req-success'
          })
        });
      }
    });

    // Mock task result endpoint to return success
    await page.route('**/api/qwen/task/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          output: {
            task_id: 'task-after-retry',
            task_status: 'SUCCEEDED',
            choices: [
              {
                message: {
                  content: [
                    { image: 'https://example.com/image.png', type: 'image' }
                  ]
                }
              }
            ]
          }
        })
      });
    });

    // Enter prompt and click generate
    await page.fill('textarea[placeholder*="Enter your image prompt"]', 'test prompt for retry');
    await page.click('button:has-text("Generate Image")');

    // Wait for error to appear (rate limit)
    await expect(page.locator('text=Error:')).toBeVisible({ timeout: 30000 });

    // Verify "Try Again" button appears for retryable error
    const tryAgainButton = page.locator('button:has-text("Try Again")');
    await expect(tryAgainButton).toBeVisible();

    // Click retry button
    await tryAgainButton.click();

    // After all retries exhausted, should show final error or success
    // In this case, we mock success after 2 failures
    // The retry logic in useImageGeneration will retry automatically
  });

  test('should handle download button click', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/qwen/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          output: {
            task_id: 'task-download-test',
            task_status: 'PENDING'
          },
          request_id: 'req-download'
        })
      });
    });

    // Mock task result to return image
    await page.route('**/api/qwen/task/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          output: {
            task_id: 'task-download-test',
            task_status: 'SUCCEEDED',
            choices: [
              {
                message: {
                  content: [
                    { image: 'https://example.com/test-image.png', type: 'image' }
                  ]
                }
              }
            ]
          }
        })
      });
    });

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Enter prompt and generate
    await page.fill('textarea[placeholder*="Enter your image prompt"]', 'test for download');
    await page.click('button:has-text("Generate Image")');

    // Wait for image
    await page.locator('img[alt="Generated image"]').waitFor({ state: 'visible', timeout: 30000 });

    // Click download button
    await page.click('a:has-text("Download Image")');

    // Wait for download to start
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('generated-image.png');
  });

  test('should reset state when clicking Start Over', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/qwen/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          output: {
            task_id: 'task-startover-test',
            task_status: 'PENDING'
          },
          request_id: 'req-startover'
        })
      });
    });

    // Mock task result to return image
    await page.route('**/api/qwen/task/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          output: {
            task_id: 'task-startover-test',
            task_status: 'SUCCEEDED',
            choices: [
              {
                message: {
                  content: [
                    { image: 'https://example.com/startover-image.png', type: 'image' }
                  ]
                }
              }
            ]
          }
        })
      });
    });

    // Enter prompt and generate
    const testPrompt = 'test prompt for start over';
    await page.fill('textarea[placeholder*="Enter your image prompt"]', testPrompt);
    await page.click('button:has-text("Generate Image")');

    // Wait for image
    await page.locator('img[alt="Generated image"]').waitFor({ state: 'visible', timeout: 30000 });

    // Verify UI state after generation
    await expect(page.locator('img[alt="Generated image"]')).toBeVisible();
    await expect(page.locator('a:has-text("Download Image")')).toBeVisible();
    await expect(page.locator('button:has-text("Start Over")')).toBeVisible();
    await expect(page.locator('button:has-text("Generate Another")')).toBeVisible();

    // Click Start Over button
    await page.click('button:has-text("Start Over")');

    // Verify state reset
    await expect(page.locator('img[alt="Generated image"]')).not.toBeVisible();
    await expect(page.locator('a:has-text("Download Image")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Start Over")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Generate Image")')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Enter your image prompt"]')).toHaveValue('');

    // Verify button is disabled again (empty prompt)
    await expect(page.locator('button:has-text("Generate Image")')).toBeDisabled();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock API to return network error
    await page.route('**/api/qwen/generate', async route => {
      await route.abort('failed');
    });

    // Collect console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Enter prompt and click generate
    await page.fill('textarea[placeholder*="Enter your image prompt"]', 'test network error');
    await page.click('button:has-text("Generate Image")');

    // Wait for error to appear
    await expect(page.locator('text=Error:')).toBeVisible();

    // Verify error message is user-friendly
    const errorElement = page.locator('.bg-destructive\\/10');
    await expect(errorElement).toContainText('Error:');
    await expect(errorElement).toContainText('💡');

    // Verify [Network Error] or [Retry] logs appear in console
    const logText = consoleLogs.join('\n');
    expect(logText).toMatch(/(Network Error|Retry|Image Generation)/);
  });
});
