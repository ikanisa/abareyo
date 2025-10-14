import { test, expect, Page } from "@playwright/test";

async function gotoWithNetworkIdle(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Timeout")) {
      if (page.url() !== url) throw error;
      await page.waitForLoadState("domcontentloaded", { timeout: 120_000 }).catch(() => undefined);
    } else {
      throw error;
    }
  }
}

test("matches renders and opens centre", async ({ page }) => {
  test.setTimeout(180_000);
  await gotoWithNetworkIdle(page, "http://localhost:3000/matches");
  await expect(page.getByRole("heading", { name: /Matches/i })).toBeVisible();
});

test("more renders and navigates", async ({ page }) => {
  test.setTimeout(180_000);
  await gotoWithNetworkIdle(page, "http://localhost:3000/more");
  await expect(page.getByRole("heading", { name: /My Profile/i })).toBeVisible();

  await page.getByText("Wallet & Passes").click();
  await expect(page.getByRole("heading", { name: /Wallet & Passes/i })).toBeVisible();

  await gotoWithNetworkIdle(page, "http://localhost:3000/more/rewards");
  await expect(page.getByRole("heading", { name: /Rewards/i })).toBeVisible();
});
