import { test, expect } from '@playwright/test';

test.describe('Marketing Hub Application', () => {
  test('should load the welcome page', async ({ page }) => {
    await page.goto('/');
    
    // Check if the welcome page loads
    await expect(page).toHaveTitle(/Marketing Hub/);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for main navigation elements (using more flexible selectors)
    await expect(page.getByText(/Welcome to.*Marketing Hub/)).toBeVisible();
    await expect(page.getByText(/Create Social Media Assets/)).toBeVisible();
    await expect(page.getByText(/Write Content/)).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Click on dashboard navigation
    await page.getByText('Dashboard').click();
    
    // Check if dashboard loads
    await expect(page.getByText('Marketing Dashboard')).toBeVisible();
    await expect(page.getByText('Recent Activity')).toBeVisible();
  });

  test('should navigate to property marketing', async ({ page }) => {
    await page.goto('/');
    
    // Click on property marketing
    await page.getByText('Property Marketing').click();
    
    // Check if property marketing page loads
    await expect(page.getByText('Property Marketing')).toBeVisible();
  });

  test('should navigate to write content', async ({ page }) => {
    await page.goto('/');
    
    // Click on write content
    await page.getByText('Write Content').click();
    
    // Check if write content page loads
    await expect(page.getByText('Content Creation')).toBeVisible();
  });

  test('should navigate to social media assets', async ({ page }) => {
    await page.goto('/');
    
    // Click on social media assets
    await page.getByText('Social Media Assets').click();
    
    // Check if social media assets page loads
    await expect(page.getByText('Social Media Assets')).toBeVisible();
  });

  test('should open and close copilot', async ({ page }) => {
    await page.goto('/');
    
    // Click on copilot button
    await page.getByRole('button', { name: /AI Copilot/i }).click();
    
    // Check if copilot opens
    await expect(page.getByText('AI Copilot')).toBeVisible();
    await expect(page.getByText('Your marketing assistant')).toBeVisible();
    
    // Close copilot
    await page.getByRole('button', { name: /close/i }).click();
    
    // Check if copilot closes
    await expect(page.getByText('AI Copilot')).not.toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if mobile layout is working
    await expect(page.getByText(/Welcome to.*Marketing Hub/)).toBeVisible();
    
    // Check if navigation is accessible on mobile
    await expect(page.getByText('Dashboard')).toBeVisible();
  });
});
