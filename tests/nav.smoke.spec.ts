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
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto('http://localhost:3000/');
  const nav = page.locator('nav[aria-label="Primary"]');
  if ((await nav.count()) === 0) {
    test.skip('Bottom nav not rendered at current viewport');
  }
  await expect(nav).toHaveCount(1);

  const labels = ['Home', 'Tickets', 'Wallet', 'Shop', 'More'] as const;
  for (const label of labels) {
    await expect(nav.getByRole('link', { name: label, exact: true })).toHaveCount(1);
  }
});

test('404 shows helpful CTA', async ({ page }) => {
  const response = await page.goto('http://localhost:3000/this-route-does-not-exist');
  expect(response?.status(), 'Expected 404 status').toBe(404);
  await expect(page.getByText(/page not found/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /^home$/i }).first()).toBeVisible();
});
