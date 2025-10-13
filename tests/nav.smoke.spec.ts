import { test, expect } from '@playwright/test';

const routes = ['/', '/matches', '/tickets', '/shop', '/services', '/more', '/more/rewards'];

for (const route of routes) {
  test(`route ${route} renders`, async ({ page }) => {
    const response = await page.goto(`http://localhost:3000${route}`);
    expect(response?.ok(), `Expected ${route} to respond with 2xx`).toBeTruthy();
    const pattern = route === '/' ? /^http:\/\/localhost:3000\/?$/ : new RegExp(`${route.replace(/\//g, '\\/')}(?:$|\/)`);
    await expect(page).toHaveURL(pattern);
  });
}

test('bottom nav works', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  for (const label of ['Home', 'Matches', 'Tickets', 'Shop', 'Community', 'More']) {
    await page.getByRole('link', { name: new RegExp(label, 'i') }).click();
    await expect(page).toHaveURL(/\/[a-z\/-]*$/);
  }
});

test('404 shows helpful CTA', async ({ page }) => {
  const response = await page.goto('http://localhost:3000/this-route-does-not-exist');
  expect(response?.status(), 'Expected 404 status').toBe(404);
  await expect(page.getByText(/page not found/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
});
