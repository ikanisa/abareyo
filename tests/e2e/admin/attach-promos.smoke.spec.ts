import { test, expect } from '@playwright/test';

test('Promotions page opens', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/shop/promotions');
  await expect(page.getByRole('heading', { name: /Shop promotions/i })).toBeVisible();
});

test('Attach SMS modal renders on ticket orders', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/orders');
  const attachButton = page.getByRole('button', { name: /Attach SMS/i }).first();
  await attachButton.click();
  await expect(page.getByText(/Attach SMS confirmation/i)).toBeVisible();
});
