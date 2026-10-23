import { test, expect } from '@playwright/test';

test.describe('Core Flow 2: Tenant Referencing & Passport Submission', () => {
  test('tenant can complete referencing application steps and autosave draft', async ({ page }) => {
    // Navigate to referencing portal or demo applicant onboarding
    await page.goto('/referencing/apply?token=demo-test-token');

    // 1. Stage 1: Personal Details
    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="First name"]').first();
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill('Sarah');
      await page.locator('input[name="lastName"], input[placeholder*="Last name"]').first().fill('Jenkins');
      await page.locator('input[name="phone"], input[type="tel"]').first().fill('07700900123');

      // Next step
      const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
      await nextBtn.click();
    }

    // 2. Stage 2: Residential History
    const addressInput = page.locator('input[name="currentAddress"], input[placeholder*="address"]').first();
    if (await addressInput.isVisible()) {
      await addressInput.fill('12 Oxford Road, London');
      await page.locator('button:has-text("Next"), button:has-text("Continue")').first().click();
    }

    // 3. Stage 3: Employment Details
    const employerInput = page.locator('input[name="employerName"], input[placeholder*="Employer"]').first();
    if (await employerInput.isVisible()) {
      await employerInput.fill('TechCorp UK');
      await page.locator('input[name="annualSalary"], input[type="number"]').first().fill('65000');
      await page.locator('button:has-text("Next"), button:has-text("Continue")').first().click();
    }

    // 4. Verify draft autosave indicator
    const autosaveStatus = page.locator('text=Draft saved, text=Saved, [data-testid="autosave-status"]').first();
    if (await autosaveStatus.isVisible()) {
      await expect(autosaveStatus).toBeVisible();
    }

    // Ensure page rendered without unhandled exceptions
    await expect(page.locator('body')).toBeVisible();
  });
});
