import { test, expect } from "@playwright/test";

test("home renders primary sections", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await expect(page.getByText(/Quick Actions/i)).toBeVisible();
});

test("shop + cart + services exist", async ({ page }) => {
  await page.goto("http://localhost:3000/shop");
  await expect(page.getByText(/Official Shop/i)).toBeVisible();
  await page.goto("http://localhost:3000/cart");
  await expect(page.getByText(/Cart/i)).toBeVisible();
  await page.goto("http://localhost:3000/services");
  await expect(page.getByText(/Services/i)).toBeVisible();
});

test("matches has minimal list", async ({ page }) => {
  await page.goto("http://localhost:3000/matches");
  await expect(page.getByText(/Matches/i)).toBeVisible();
});
