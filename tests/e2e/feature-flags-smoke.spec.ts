import { test, expect } from '@playwright/test';

test('feature flag toggle updates UI', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/settings');
  // Find the UI row by key label
  const row = page.getByText('ui.new_shop_flow');
  await expect(row).toBeVisible();
  // Toggle the first switch on the page
  const switchEl = page.getByRole('switch').first();
  const checkedBefore = await switchEl.getAttribute('aria-checked');
  await switchEl.click();
  // Wait for optimistic update and toast
  await expect(page.getByText('Updated')).toBeVisible();
  const checkedAfter = await switchEl.getAttribute('aria-checked');
  expect(checkedAfter).not.toBe(checkedBefore);
});

