import { test, expect } from '@playwright/test';

test('tickets renders upcoming match cards', async ({ page }) => {
  await page.goto('http://localhost:3000/tickets');
  await expect(page.getByRole('heading', { name: /Upcoming Matches/i })).toBeVisible();
  const matchCards = page.locator('a.card');
  await expect(matchCards.first()).toBeVisible();
  await expect(matchCards.first().getByText(/USSD/i)).toBeVisible();
});

test('shop renders minimal catalog products', async ({ page }) => {
  await page.goto('http://localhost:3000/shop');
  await expect(page.getByRole('heading', { name: /Official Shop/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Home Jersey 24\/25/i })).toBeVisible();
  await expect(page.getByText(/RWF/)).toBeVisible();
});
