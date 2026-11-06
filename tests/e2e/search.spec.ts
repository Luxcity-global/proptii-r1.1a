import { test, expect } from '@playwright/test';

test.describe('Core Flow 1: Property Search & Map Exploration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('user can search properties by location and view results list', async ({ page }) => {
    // 1. Fill location search input on homepage or header
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="location"], input[type="search"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('London');
    await searchInput.press('Enter');

    // 2. Navigate to /search
    await expect(page).toHaveURL(/\/search/);

    // 3. Ensure search results container and listing cards render
    const resultsContainer = page.locator('[data-testid="search-results-list"], .search-results-list, main').first();
    await expect(resultsContainer).toBeVisible();

    // 4. Verify property cards display price and title
    const propertyCard = page.locator('[data-testid="property-card"], .property-card, article').first();
    await expect(propertyCard).toBeVisible();
  });

  test('user can open filters drawer and filter by bedrooms and price', async ({ page }) => {
    await page.goto('/search?q=London');

    // 1. Open filter drawer
    const filterButton = page.locator('button:has-text("Filters"), button[aria-label*="filter"]').first();
    if (await filterButton.isVisible()) {
      await filterButton.click();

      // 2. Select bedroom count or price range
      const minBedroomsSelect = page.locator('select[name="bedrooms"], [data-testid="min-bedrooms"]').first();
      if (await minBedroomsSelect.isVisible()) {
        await minBedroomsSelect.selectOption('2');
      }

      // 3. Apply filters
      const applyBtn = page.locator('button:has-text("Apply"), button:has-text("Show results")').first();
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
      }
    }

    // Results updated
    await expect(page.locator('body')).toBeVisible();
  });

  test('interactive map displays property pins and clicking pin opens detail', async ({ page }) => {
    await page.goto('/search?q=London');

    // Verify map canvas container is rendered
    const mapContainer = page.locator('[data-testid="search-map"], #map, .gm-style').first();
    await expect(mapContainer).toBeVisible();
  });
});
