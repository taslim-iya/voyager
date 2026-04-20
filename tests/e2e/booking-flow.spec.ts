import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'traveler@acme.test');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('search flights and select a result', async ({ page }) => {
    await page.goto('/search/flights');
    await expect(page.locator('h1')).toContainText('Search Flights');

    // Fill search form
    await page.fill('input[placeholder*="London"]', 'London (LHR)');
    await page.fill('input[placeholder*="New York"]', 'New York (JFK)');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 14);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateStr);

    // Search
    await page.click('button:has-text("Search Flights")');

    // Wait for results
    await page.waitForSelector('.card:has-text("Book via Duffel")', { timeout: 10000 });

    // Verify result cards exist
    const results = page.locator('.card:has-text("Book via Duffel")');
    await expect(results.first()).toBeVisible();

    // Click book
    await results.first().locator('button:has-text("Book via Duffel")').click();

    // Should navigate to booking form
    await page.waitForURL(/\/book\/duffel\//);
    await expect(page.locator('h1')).toContainText('Complete Booking');
  });

  test('view trips page', async ({ page }) => {
    await page.goto('/trips');
    await expect(page.locator('h1')).toContainText('My Trips');
  });

  test('view profile page', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText('Profile');
  });
});
