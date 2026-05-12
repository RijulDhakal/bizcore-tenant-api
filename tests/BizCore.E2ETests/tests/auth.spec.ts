import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('login page loads correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('login form has required fields', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('register link is visible', async ({ page }) => {
    await expect(page.getByText(/register/i)).toBeVisible();
  });
});
