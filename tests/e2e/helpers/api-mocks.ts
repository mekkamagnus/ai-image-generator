import { Page, Route } from '@playwright/test';

/**
 * API Mocking Helpers for E2E Tests
 *
 * Mocks DashScope API responses to avoid making real API calls during tests.
 * This ensures tests are fast, reliable, and don't consume API quota.
 */

export const MOCK_TASK_ID = 'mock-task-123';
export const MOCK_IMAGE_URL = 'https://example.com/mock-image.jpg';

/**
 * Mock successful image generation workflow
 * - Returns synchronous response with image URL directly
 */
export async function mockSuccessfulImageGeneration(page: Page) {
  // Mock task creation endpoint to return synchronous response with image
  await page.route('**/api/qwen/services/aigc/multimodal-generation/generation', async (route: Route) => {
    console.log('[Mock] Intercepted image generation request - returning synchronous response');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        output: {
          choices: [{
            finish_reason: 'stop',
            message: {
              content: [{ image: MOCK_IMAGE_URL, type: 'image' }],
              role: 'assistant'
            }
          }],
          task_metric: { FAILED: 0, SUCCEEDED: 1, TOTAL: 1 }
        },
        usage: {
          height: 1328,
          image_count: 1,
          width: 1328
        },
        request_id: 'mock-request-id',
      }),
    });
  });
}

/**
 * Mock API error response
 */
export async function mockAPIError(
  page: Page,
  errorCode: string = 'InvalidApiKey',
  statusCode: number = 401
) {
  await page.route('**/api/qwen/services/aigc/multimodal-generation/generation', async (route: Route) => {
    console.log(`[Mock] Returning API error: ${errorCode}`);
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({
        code: errorCode,
        message: 'API error occurred',
      }),
    });
  });
}

/**
 * Mock network error (request fails)
 */
export async function mockNetworkError(page: Page) {
  await page.route('**/api/qwen/services/aigc/multimodal-generation/generation', async (route: Route) => {
    console.log('[Mock] Aborting request (network error)');
    await route.abort();
  });
}

/**
 * Mock rate limit error (retryable)
 */
export async function mockRateLimitError(page: Page) {
  await page.route('**/api/qwen/services/aigc/multimodal-generation/generation', async (route: Route) => {
    console.log('[Mock] Returning rate limit error');
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'RateLimitExceeded',
        message: 'Too many requests',
      }),
    });
  });
}

/**
 * Mock image URL that returns a real image
 */
export async function mockImageDownload(page: Page) {
  await page.route(MOCK_IMAGE_URL, async (route: Route) => {
    console.log('[Mock] Serving mock image');
    // Return a tiny 1x1 PNG
    const base64Image =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(base64Image, 'base64'),
    });
  });
}

/**
 * Setup all common mocks for tests
 */
export async function setupTestMocks(page: Page) {
  // Enable detailed console logging
  page.on('console', msg => {
    console.log('[Browser Console]', msg.type(), msg.text());
  });

  // Mock the image download
  await mockImageDownload(page);
}
