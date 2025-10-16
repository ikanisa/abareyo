import { test, expect } from '@playwright/test';

test('news loads when flag on', async ({ page }) => {
  await page.goto('http://localhost:3000/news');
  // When flag enabled, at least header appears
  await expect(page.getByText(/News & Media/i)).toBeVisible();
});

test('personalized rail does not crash', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByTestId('personalized-rail')).toBeVisible({ timeout: 15000 });
});

test('live score widget displays when flag on', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByRole('heading', { name: /Live score/i })).toBeVisible();
  await expect(page.getByText(/Rayon vs APR/i)).toBeVisible();
});

test('news article detail renders', async ({ page }) => {
  await page.goto('http://localhost:3000/news/rayon-derby-prep');
  await expect(page.getByRole('heading', { name: /Rayon SC keep pressure high ahead of derby/i })).toBeVisible();
  await expect(page.getByText(/Rayon Sports Media/i)).toBeVisible();
});

test('media page lists fallback clip', async ({ page }) => {
  await page.goto('http://localhost:3000/media');
  await expect(page.getByRole('heading', { name: /Highlights & Clips/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Inside Camp: Matchday motivation/i })).toBeVisible();
});
