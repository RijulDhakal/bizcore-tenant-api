import { test, expect } from '@playwright/test';

test.describe('Example', () => {
  test('homepage redirects to dashboard or login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(dashboard|login)/, { timeout: 10000 });
  });

  test('navigation to settings page works', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/(settings|login)/, { timeout: 10000 });
  });
});
