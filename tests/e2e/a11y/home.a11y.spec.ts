import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("home accessibility", () => {
  test("home has no critical accessibility violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("main", { state: "visible" });

    const accessibilityScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const criticalViolations = accessibilityScan.violations.filter(
      (violation) => violation.impact === "critical",
    );

    expect(criticalViolations).toEqual([]);
  });
});
