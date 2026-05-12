import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('dashboard page loads', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard|\/login/, { timeout: 10000 });
  });

  test('navigation menu is present', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 10000 });
  });
});
