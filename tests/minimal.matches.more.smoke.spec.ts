import { test, expect } from "@playwright/test";

test("matches renders and opens centre", async ({ page }) => {
  await page.goto("http://localhost:3000/matches");
  await expect(page.getByRole("heading", { name: /Matches/i })).toBeVisible();
});

test("more renders and navigates", async ({ page }) => {
  await page.goto("http://localhost:3000/more");
  await expect(page.getByText(/My Profile/i)).toBeVisible();
  await page.click("text=Wallet & Passes");
  await expect(page.getByText(/Wallet & Passes/i)).toBeVisible();
  await page.goto("http://localhost:3000/more/rewards");
  await expect(page.getByText(/Rewards/i)).toBeVisible();
});
