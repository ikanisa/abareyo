import { test, expect } from '@playwright/test';

test('membership page renders and shows members table', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/membership');
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
  // Auto‑renew toggle should exist in table
  await expect(page.getByRole('switch')).toBeVisible();
});

