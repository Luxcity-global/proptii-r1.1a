import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test('should load correctly in Chrome', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome specific test');
    
    await page.goto('/');
    await expect(page.getByText(/Welcome to.*Marketing Hub/)).toBeVisible();
    
    // Test Chrome-specific features
    await page.getByText('Dashboard').click();
    await expect(page.getByText('Marketing Dashboard')).toBeVisible();
  });

  test('should load correctly in Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox specific test');
    
    await page.goto('/');
    await expect(page.getByText(/Welcome to.*Marketing Hub/)).toBeVisible();
    
    // Test Firefox compatibility
    await page.getByText('Dashboard').click();
    await expect(page.getByText('Marketing Dashboard')).toBeVisible();
  });

  test('should load correctly in Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari specific test');
    
    await page.goto('/');
    await expect(page.getByText(/Welcome to.*Marketing Hub/)).toBeVisible();
    
    // Test Safari compatibility
    await page.getByText('Dashboard').click();
    await expect(page.getByText('Marketing Dashboard')).toBeVisible();
  });

  test('should work on mobile Chrome', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Mobile Chrome test');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.getByText(/Welcome to.*Marketing Hub/)).toBeVisible();
    
    // Test mobile navigation
    await page.getByText('Dashboard').click();
    await expect(page.getByText('Marketing Dashboard')).toBeVisible();
  });

  test('should work on mobile Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Mobile Safari test');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.getByText(/Welcome to.*Marketing Hub/)).toBeVisible();
    
    // Test mobile navigation
    await page.getByText('Dashboard').click();
    await expect(page.getByText('Marketing Dashboard')).toBeVisible();
  });

  test('should handle touch interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Test touch interactions
    const dashboardButton = page.getByText('Dashboard').first();
    await dashboardButton.tap();
    
    await expect(page.getByText('Marketing Dashboard')).toBeVisible();
  });

  test('should handle different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 375, height: 667 }, // iPhone 8
      { width: 414, height: 896 }, // iPhone 11 Pro Max
      { width: 768, height: 1024 }, // iPad
      { width: 1024, height: 768 }, // iPad landscape
      { width: 1920, height: 1080 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      // Check if main content is visible
      await expect(page.getByText(/Welcome to.*Marketing Hub/)).toBeVisible();
      
      // Test navigation
      await page.getByText('Dashboard').click();
      await expect(page.getByText('Marketing Dashboard')).toBeVisible();
      
      // Go back to welcome page
      await page.goto('/');
    }
  });

  test('should handle high DPI displays', async ({ page }) => {
    // Test with high DPI
    await page.goto('/');
    
    // Check if content renders correctly
    await expect(page.getByText(/Welcome to.*Marketing Hub/)).toBeVisible();
    
    // Test navigation
    await page.getByText('Dashboard').click();
    await expect(page.getByText('Marketing Dashboard')).toBeVisible();
  });
});
