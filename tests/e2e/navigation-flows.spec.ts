import { expect, test } from "@playwright/test";

const HOME = "/";

const quickActions = [
  { locator: /Open match tickets/i, heading: "Upcoming Matches" },
  { locator: /View membership plans/i, heading: "Gikundiro Membership" },
  { locator: /Browse the club shop/i, heading: "Official Shop" },
  { locator: /Support fundraising campaigns/i, heading: "Fundraising" },
];

test.describe("Primary navigation flows", () => {
  test("home quick actions reach expected destinations", async ({ page }) => {
    for (const action of quickActions) {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible({ timeout: 15000 });
      const target = page.getByRole("link", { name: action.locator });
      await expect(target).toBeVisible({ timeout: 15000 });
      await target.click();
      await expect(page.getByRole("heading", { name: action.heading })).toBeVisible({ timeout: 15000 });
    }
  });

  test("services hub offers reliable back navigation", async ({ page }) => {
    await page.goto("/services", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Partner Services" })).toBeVisible({ timeout: 15000 });

    await page.getByLabel("Go back").click();
    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible({ timeout: 15000 });
  });

  test("gamification tiles route to the community hub", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    const tile = page.getByRole("link", { name: "Open the daily check-in mission" });
    await expect(tile).toBeVisible({ timeout: 15000 });
    await tile.click();
    await expect(page).toHaveURL(/\/community$/);
    await expect(page.getByRole("heading", { name: /Community/i })).toBeVisible({ timeout: 15000 });
  });

  test("community deep links load dedicated views", async ({ page }) => {
    const communityDestinations = [
      { path: "/community/predict", heading: "Predict & Win" },
      { path: "/community/missions", heading: "Community Missions" },
      { path: "/community/polls/motm", heading: "Who is your player of the match?" },
    ];

    for (const destination of communityDestinations) {
      await page.goto(destination.path, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { name: destination.heading })).toBeVisible({ timeout: 15000 });
    }
  });

  test("media and news content flows render correctly", async ({ page }) => {
    await page.goto("/media", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Media Hub" })).toBeVisible({ timeout: 15000 });
    const goalClip = page.getByRole("link", { name: /Goal clip/i });
    await expect(goalClip).toBeVisible({ timeout: 15000 });
    await goalClip.click();
    await expect(page.getByRole("heading", { name: /Goal clip/i })).toBeVisible({ timeout: 15000 });
    await page.getByLabel("Go back").click();
    await expect(page.getByRole("heading", { name: "Media Hub" })).toBeVisible({ timeout: 15000 });

    await page.goto("/news/training-updates", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Training updates ahead of the derby" })).toBeVisible({
      timeout: 15000,
    });
    await page.getByLabel("Go back").click();
    await expect(page.getByRole("heading", { name: "Club Newsroom" })).toBeVisible({ timeout: 15000 });
  });
});
