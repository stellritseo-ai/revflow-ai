import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to dashboard on successful login', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/auth/login');
    
    // Check if we are on the login page by looking for specific text/elements
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();

    // Fill the login form
    await page.getByLabel(/Email/i).fill('demo@example.com');
    await page.getByLabel(/Password/i).fill('password123');

    // Submit the form
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Verify successful login by checking for dashboard elements
    // The dashboard has a heading "Good morning, Dr. Jenkins" based on our previous checks
    await expect(page.getByRole('heading', { name: /Good morning/i })).toBeVisible({ timeout: 10000 });
  });
});
