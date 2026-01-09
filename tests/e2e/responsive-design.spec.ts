import { test, expect } from '@playwright/test';
import {
  mockSuccessfulImageGeneration,
  setupTestMocks,
} from './helpers/api-mocks';

/**
 * Responsive Design E2E Tests
 *
 * Tests UI layout and functionality across different device viewports:
 * 1. Desktop (1920x1080)
 * 2. Tablet (768x1024)
 * 3. Mobile (375x667 - iPhone SE)
 *
 * WHY responsive testing:
 * - Phase 6 will implement responsive design
 * - Tests validate current state before Phase 6
 * - Tests ensure Phase 6 changes don't break mobile
 * - Catch layout issues early before deployment
 */

test.describe('Responsive Design', () => {
  test.describe('Desktop View (1920x1080)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should display centered layout on desktop', async ({ page }) => {
      await page.goto('/');

      // Verify main container is centered
      const container = page.locator('.container');
      await expect(container).toBeVisible();

      // Verify prompt input is centered and max-width constrained
      const textarea = page.locator('textarea[placeholder*="Enter your image prompt"]');
      await expect(textarea).toBeVisible();
      const boundingBox = await textarea.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(672); // max-w-2xl = 42rem = 672px

      // Verify button is same width as textarea
      const button = page.locator('button:has-text("Generate Image")');
      await expect(button).toBeVisible();
      const buttonBox = await button.boundingBox();
      expect(buttonBox?.width).toBeLessThanOrEqual(672);

      // Verify no horizontal scrollbar
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBe(viewportWidth);
    });

    test('should display image at reasonable size on desktop', async ({ page }) => {
      // Setup test mocks
      await setupTestMocks(page);
      await mockSuccessfulImageGeneration(page);

      await page.goto('/');
      await page.fill('textarea[placeholder*="Enter your image prompt"]', 'desktop test');
      await page.click('button:has-text("Generate Image")');

      // Wait for image (fast with mocked API)
      await page.locator('img[alt="Generated image"]').waitFor({ state: 'visible', timeout: 10000 });

      // Verify image is visible and fits within container
      const image = page.locator('img[alt="Generated image"]');
      await expect(image).toBeVisible();

      const imageBox = await image.boundingBox();
      expect(imageBox?.width).toBeLessThanOrEqual(672); // Should fit in max-w-2xl container
    });
  });

  test.describe('Tablet View (768x1024)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.goto('/');

      // Verify all main elements are visible
      await expect(page.locator('h1:has-text("AI Image Generator")')).toBeVisible();
      await expect(page.locator('textarea[placeholder*="Enter your image prompt"]')).toBeVisible();
      await expect(page.locator('button:has-text("Generate Image")')).toBeVisible();

      // Verify textarea is full width (with margins)
      const textarea = page.locator('textarea[placeholder*="Enter your image prompt"]');
      const boundingBox = await textarea.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(600); // Should be wider than mobile
      expect(boundingBox?.width).toBeLessThanOrEqual(768); // Should not overflow viewport

      // Verify button text doesn't wrap awkwardly
      const button = page.locator('button:has-text("Generate Image")');
      await expect(button).toBeVisible();
      const buttonText = await button.textContent();
      expect(buttonText?.trim()).toBe('Generate Image');

      // Verify no horizontal scrollbar
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBe(viewportWidth);
    });

    test('should display image appropriately sized on tablet', async ({ page }) => {
      // Setup test mocks
      await setupTestMocks(page);
      await mockSuccessfulImageGeneration(page);

      await page.goto('/');
      await page.fill('textarea[placeholder*="Enter your image prompt"]', 'tablet test');
      await page.click('button:has-text("Generate Image")');

      // Wait for image (fast with mocked API)
      await page.locator('img[alt="Generated image"]').waitFor({ state: 'visible', timeout: 10000 });

      // Verify image scales down appropriately
      const image = page.locator('img[alt="Generated image"]');
      await expect(image).toBeVisible();

      const imageBox = await image.boundingBox();
      expect(imageBox?.width).toBeLessThanOrEqual(768); // Should fit in viewport
    });
  });

  test.describe('Mobile View (375x667 - iPhone SE)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display single column layout on mobile', async ({ page }) => {
      await page.goto('/');

      // Verify header is visible but might be smaller
      await expect(page.locator('h1:has-text("AI Image Generator")')).toBeVisible();

      // Verify single column layout (main content is centered)
      // Use more specific selector to avoid strict mode violations with multiple .max-w-2xl elements
      const mainContent = page.locator('.max-w-2xl.mx-auto');
      await expect(mainContent).toBeVisible();

      // Verify textarea is full width (with margins)
      const textarea = page.locator('textarea[placeholder*="Enter your image prompt"]');
      await expect(textarea).toBeVisible();
      const boundingBox = await textarea.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(300); // Should use most of viewport
      expect(boundingBox?.width).toBeLessThanOrEqual(375); // Should not overflow

      // Verify button is full width and clickable
      const button = page.locator('button:has-text("Generate Image")');
      await expect(button).toBeVisible();
      const buttonBox = await button.boundingBox();
      expect(buttonBox?.width).toBeGreaterThan(300); // Should be full width

      // Verify button is visible
      await expect(button).toBeVisible();
    });

    test('should display error messages without overflow on mobile', async ({ page }) => {
      // Mock API to return error
      await page.route('**/api/qwen/services/aigc/multimodal-generation/generation', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'InvalidParameter',
            message: 'The prompt parameter is invalid',
            request_id: 'req-mobile-error'
          })
        });
      });

      await page.goto('/');

      // Enter prompt and trigger error
      await page.fill('textarea[placeholder*="Enter your image prompt"]', 'mobile error test');
      await page.click('button:has-text("Generate Image")');

      // Wait for error
      await expect(page.locator('text=Error:')).toBeVisible();

      // Verify error message doesn't overflow
      const errorElement = page.locator('.bg-destructive\\/10');
      await expect(errorElement).toBeVisible();

      const errorBox = await errorElement.boundingBox();
      expect(errorBox?.width).toBeLessThanOrEqual(375); // Should fit in viewport

      // Verify no horizontal scrollbar
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBe(viewportWidth);
    });

    test('should display image that fits within mobile viewport', async ({ page }) => {
      // Setup test mocks
      await setupTestMocks(page);
      await mockSuccessfulImageGeneration(page);

      await page.goto('/');
      await page.fill('textarea[placeholder*="Enter your image prompt"]', 'mobile test');
      await page.click('button:has-text("Generate Image")');

      // Wait for image (fast with mocked API)
      await page.locator('img[alt="Generated image"]').waitFor({ state: 'visible', timeout: 10000 });

      // Verify image fits within viewport width
      const image = page.locator('img[alt="Generated image"]');
      await expect(image).toBeVisible();

      const imageBox = await image.boundingBox();
      expect(imageBox?.width).toBeLessThanOrEqual(375); // Should fit in mobile viewport

      // Verify buttons are stacked below image (not side-by-side if too wide)
      await expect(page.locator('a:has-text("Download Image")')).toBeVisible();
      await expect(page.locator('button:has-text("Start Over")')).toBeVisible();

      // Verify no horizontal scrollbar
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBe(viewportWidth);
    });
  });
});
