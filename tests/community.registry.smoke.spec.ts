import "./setup-env";
import { expect, test } from "@playwright/test";

type RegistryRoute = {
  path: string;
  expectedStatus: number;
  heading: RegExp;
};

const registryRoutes: RegistryRoute[] = [
  {
    path: "/clubs",
    heading: /Page not found/i,
    expectedStatus: 404,
  },
  {
    path: "/events",
    heading: /Club Events/i,
    expectedStatus: 200,
  },
];

test.describe("community registry smoke", () => {
  for (const route of registryRoutes) {
    test(`renders expected heading for ${route.path}`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response, `Expected navigation to ${route.path} to resolve a response`).toBeTruthy();
      expect(response?.status(), `Unexpected status for ${route.path}`).toBe(route.expectedStatus);

      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
    });
  }
});
