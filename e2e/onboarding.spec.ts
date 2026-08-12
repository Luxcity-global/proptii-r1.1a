import { test, expect } from '@playwright/test';

test.describe('Role Selection & Dashboard Flow', () => {
  test('should load the homepage and capture UI', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the main page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'e2e-screenshots/homepage.png', fullPage: true });
    
    expect(await page.title()).not.toBe('');
  });

  test('should load the role selection page and capture UI', async ({ page }) => {
    // Navigate to role selection manually for test (assuming it's accessible or mocking auth)
    // Note: because MSAL handles actual auth, we will just visit the routes that are public 
    // or simulate if needed. Since we are doing a graphical test, we want to capture the UI.
    
    await page.goto('/role-selection');
    
    // Wait for the role selection elements to be visible
    await page.waitForSelector('text=I am a Landlord', { timeout: 10000 }).catch(() => null);
    
    // Take screenshot of role selection
    await page.screenshot({ path: 'e2e-screenshots/role-selection.png', fullPage: true });
  });

  test('should load the landlord dashboard and capture UI', async ({ page }) => {
    // Inject mock authentication state into localStorage to bypass Azure B2C
    // This makes the React AuthContext believe the user is already logged in as a Landlord.
    await page.addInitScript(() => {
      window.localStorage.setItem('mock_token', 'fake-jwt-token');
      window.localStorage.setItem('userRole', 'landlord');
      // Set MSAL cache items if AuthContext strictly checks MSAL session storage
      window.sessionStorage.setItem('msal.account.keys', '["fake-account-id"]');
    });

    await page.goto('/landlord/dashboard');
    
    // Wait for the dashboard to render
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'e2e-screenshots/landlord-dashboard.png', fullPage: true });
  });

  test('should load the tenant dashboard and capture UI', async ({ page }) => {
    // Inject mock authentication state for a Tenant
    await page.addInitScript(() => {
      window.localStorage.setItem('mock_token', 'fake-jwt-token');
      window.localStorage.setItem('userRole', 'tenant');
      window.sessionStorage.setItem('msal.account.keys', '["fake-account-id"]');
    });

    await page.goto('/dashboard');
    
    // Wait for the dashboard to render
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'e2e-screenshots/tenant-dashboard.png', fullPage: true });
  });
});
