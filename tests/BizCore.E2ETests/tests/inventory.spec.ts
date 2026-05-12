import { test, expect } from '@playwright/test';

test.describe('Inventory Management', () => {
  test('inventory page loads', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible({ timeout: 10000 });
  });

  test('product list is displayed', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page.getByText(/products/i).or(page.getByText(/items/i))).toBeVisible({ timeout: 10000 });
  });

  test('add product button exists', async ({ page }) => {
    await page.goto('/inventory');
    const addButton = page.getByRole('button', { name: /add product/i });
    await expect(addButton.or(page.getByRole('button', { name: /new/i }))).toBeVisible({ timeout: 10000 });
  });
});
