import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  const response = await page.request.post("/api/e2e/admin/auth/login", {
    data: { email: "admin@example.com", password: "password" },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe("admin shell accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin dashboard axe audit", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForSelector("#admin-main-content", { state: "visible" });

    const accessibilityScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    test.info().annotations.push({
      type: "a11y-audit",
      description: `Admin dashboard axe scan completed with ${accessibilityScan.violations.length} violations detected`,
    });

    if (accessibilityScan.violations.length > 0) {
      const summary = accessibilityScan.violations
        .map((violation) => `${violation.id}: ${violation.help} (${violation.impact ?? "unknown"})`)
        .join("\n");
      test.info().annotations.push({ type: "axe-violations", description: summary });
    }

    const criticalViolations = accessibilityScan.violations.filter(
      (violation) => violation.impact === "critical",
    );

    expect(criticalViolations).toEqual([]);
  });

  test("supports skip navigation via keyboard", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForSelector("#admin-main-content", { state: "attached" });

    await page.keyboard.press("Tab");
    const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focusedText).toContain("Skip to main content");

    await page.keyboard.press("Enter");
    await expect(page.locator("#admin-main-content")).toBeFocused();

    test.info().annotations.push({
      type: "a11y-audit",
      description: "Verified skip-to-content link focuses main content when activated via keyboard",
    });
  });
});
