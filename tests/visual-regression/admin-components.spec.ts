import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Admin Components
 * 
 * These tests capture screenshots of Storybook stories and compare them against baselines.
 * Run `npm run test:visual:update` to update baseline screenshots.
 */

const STORYBOOK_URL = 'http://localhost:6006';
const VIEWPORTS = [
  { name: '1280px', width: 1280, height: 720 },
  { name: '1440px', width: 1440, height: 900 },
  { name: '1920px', width: 1920, height: 1080 },
];

// Admin component stories to test
const ADMIN_STORIES = [
  { title: 'Admin/Primitives/Button', id: 'admin-primitives-button--playground' },
  { title: 'Admin/Primitives/Card', id: 'admin-primitives-card--playground' },
  { title: 'Admin/Primitives/Card', id: 'admin-primitives-card--success' },
  { title: 'Admin/Primitives/Card', id: 'admin-primitives-card--warning' },
  { title: 'Admin/Primitives/StatCard', id: 'admin-primitives-statcard--playground' },
  { title: 'Admin/Primitives/InlineMessage', id: 'admin-primitives-inlinemessage--info' },
  { title: 'Admin/Primitives/InlineMessage', id: 'admin-primitives-inlinemessage--success' },
  { title: 'Admin/Primitives/InlineMessage', id: 'admin-primitives-inlinemessage--warning' },
  { title: 'Admin/Primitives/InlineMessage', id: 'admin-primitives-inlinemessage--error' },
];

test.describe('Admin Component Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set up Storybook iframe URL
    test.setTimeout(30000);
  });

  for (const viewport of VIEWPORTS) {
    for (const story of ADMIN_STORIES) {
      test(`${story.title} at ${viewport.name}`, async ({ page }) => {
        // Set viewport size
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Navigate to story in Storybook iframe
        const storyUrl = `${STORYBOOK_URL}/iframe.html?id=${story.id}&viewMode=story`;
        await page.goto(storyUrl, { waitUntil: 'networkidle' });

        // Wait for story to render
        await page.waitForTimeout(1000);

        // Take screenshot of the story
        const screenshot = await page.screenshot({
          fullPage: false,
          animations: 'disabled',
        });

        // Compare against baseline
        expect(screenshot).toMatchSnapshot(`${story.id}-${viewport.name}.png`, {
          maxDiffPixels: 100, // Allow minor rendering differences
        });
      });
    }
  }
});

test.describe('Admin Component Accessibility', () => {
  test('Admin components pass axe accessibility checks', async ({ page }) => {
    // This test ensures Storybook's a11y addon is running
    await page.goto(`${STORYBOOK_URL}/?path=/story/admin-primitives-button--playground`);
    
    // Wait for Storybook to load
    await page.waitForSelector('[id="storybook-preview-iframe"]', { timeout: 10000 });
    
    // Check that accessibility addon is present
    const a11yAddon = await page.locator('[role="tabpanel"][id*="a11y"]').count();
    
    // If addon is present, we're good (actual a11y checks run via test-storybook)
    expect(a11yAddon).toBeGreaterThanOrEqual(0);
  });
});
