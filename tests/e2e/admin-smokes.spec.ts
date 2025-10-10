import { test, expect } from '@playwright/test';

test('unauthenticated admin routes redirect to login, login works', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole('heading', { name: 'Admin Console' })).toBeVisible();

  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText('Operations Snapshot')).toBeVisible();
});

test('shop orders list renders and basic search input exists', async ({ page }) => {
  // Ensure logged in first
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/shop');
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
  // DataTable search input
  await expect(page.getByPlaceholder('Search order id/email')).toBeVisible();
});

test('fundraising dashboard renders donations table', async ({ page }) => {
  // Login (if not already)
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/fundraising');
  await expect(page.getByRole('heading', { name: 'Recent Donations' })).toBeVisible();
});
