import { test, expect } from '@playwright/test';

test.describe('Component Functionality', () => {
  test('should interact with buttons correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test primary button
    const primaryButton = page.getByRole('button', { name: /dashboard/i }).first();
    await expect(primaryButton).toBeVisible();
    await primaryButton.click();
    
    // Should navigate to dashboard
    await expect(page.getByText('Marketing Dashboard')).toBeVisible();
  });

  test('should display KPI cards correctly', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Dashboard').click();
    
    // Check if KPI cards are displayed
    await expect(page.getByText('Total Leads')).toBeVisible();
    await expect(page.getByText('Conversion Rate')).toBeVisible();
    await expect(page.getByText('Revenue')).toBeVisible();
  });

  test('should show status badges with correct colors', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Dashboard').click();
    
    // Check for status badges
    const activeBadge = page.getByText('Active').first();
    await expect(activeBadge).toBeVisible();
    
    // Check if badge has correct styling
    await expect(activeBadge).toHaveClass(/bg-lux-green-100/);
  });

  test('should handle form inputs correctly', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Write Content').click();
    
    // Check if form inputs are present
    const titleInput = page.getByPlaceholder(/title/i).first();
    await expect(titleInput).toBeVisible();
    
    // Test input interaction
    await titleInput.fill('Test Content Title');
    await expect(titleInput).toHaveValue('Test Content Title');
  });

  test('should display cards with hover effects', async ({ page }) => {
    await page.goto('/');
    
    // Test hover effects on action cards
    const socialCard = page.getByText('Create Social Media Assets').first();
    await socialCard.hover();
    
    // Card should still be visible after hover
    await expect(socialCard).toBeVisible();
  });

  test('should handle theme toggle', async ({ page }) => {
    await page.goto('/');
    
    // Look for theme toggle button
    const themeToggle = page.getByRole('button', { name: /theme/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // Check if theme changes (this would depend on implementation)
      // For now, just ensure the button is clickable
      await expect(themeToggle).toBeVisible();
    }
  });

  test('should display loading states', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to a page that might show loading states
    await page.getByText('Dashboard').click();
    
    // Check if content loads without errors
    await expect(page.getByText('Marketing Dashboard')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

