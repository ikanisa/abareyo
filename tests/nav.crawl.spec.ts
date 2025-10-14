import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const reportPath = path.join(process.cwd(), 'reports', 'link-audit.json');
let crawlTargets: string[] = [];

try {
  const raw = fs.readFileSync(reportPath, 'utf8');
  const parsed = JSON.parse(raw) as { summary?: { uniqueInternalTargets?: string[] } };
  crawlTargets = parsed.summary?.uniqueInternalTargets ?? [];
} catch (error) {
  console.warn('Unable to load link audit report, defaulting to canonical routes.', error);
}

const canonicalSeeds = ['/', '/matches', '/tickets', '/shop', '/services', '/more', '/more/rewards'];
const baseUrl = 'http://localhost:3000';

const normaliseTargets = (targets: string[]) =>
  Array.from(
    new Set(
      targets
        .concat(canonicalSeeds)
        .filter((href) => href.startsWith('/') && !href.startsWith('/api') && !href.startsWith('/_next')),
    ),
  ).sort();

const targets = normaliseTargets(crawlTargets);

const navResultsPath = path.join(process.cwd(), 'reports', 'nav-results.json');

const ensureReportsDir = () => {
  const dir = path.dirname(navResultsPath);
  fs.mkdirSync(dir, { recursive: true });
};

type CrawlResult = {
  target: string;
  status: number | null;
  heading: string | null;
  navigatedVia: 'click' | 'goto';
};

const captureHeading = async (page: import('@playwright/test').Page) => {
  const heading = await page.locator('h1, h2').first();
  if (await heading.count()) {
    const text = await heading.textContent();
    return text?.trim() ?? null;
  }
  return null;
};

const normalisePath = (value: string) => {
  if (value === '/') {
    return '/';
  }
  return value.replace(/\/$/, '');
};

const attemptClick = async (
  page: import('@playwright/test').Page,
  target: string,
  seedRoutes: string[],
): Promise<{ status: number | null; heading: string | null; via: 'click' | 'goto' }> => {
  for (const seed of seedRoutes) {
    await page.goto(`${baseUrl}${seed}`);
    const link = page.locator(`a[href="${target}"]`).first();
    if ((await link.count()) === 0) {
      continue;
    }
    await Promise.all([
      page.waitForURL(
        (url) => normalisePath(url.pathname) === normalisePath(target),
        { timeout: 10_000 },
      ),
      link.click({ timeout: 10_000 }),
    ]);
    const response = await page.request.get(`${baseUrl}${target}`);
    const heading = await captureHeading(page);
    return { status: response.status(), heading, via: 'click' };
  }

  const response = await page.goto(`${baseUrl}${target}`, { waitUntil: 'domcontentloaded' });
  const heading = await captureHeading(page);
  return { status: response?.status() ?? null, heading, via: 'goto' };
};

test.describe('navigation crawl', () => {
  test('crawl internal targets without 404s', async ({ page }) => {
    const results: CrawlResult[] = [];

    for (const target of targets) {
      const outcome = await attemptClick(page, target, canonicalSeeds);
      results.push({ target, status: outcome.status, heading: outcome.heading, navigatedVia: outcome.via });
      expect(outcome.status ?? 0, `${target} returned unexpected status`).toBeGreaterThanOrEqual(200);
      expect(outcome.status ?? 0, `${target} returned unexpected status`).toBeLessThan(400);
    }

    ensureReportsDir();
    fs.writeFileSync(
      navResultsPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          results,
        },
        null,
        2,
      ),
    );
  });
});
