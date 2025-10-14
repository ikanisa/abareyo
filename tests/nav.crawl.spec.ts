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

test.describe.configure({ timeout: 180_000 });

const normaliseTargets = (targets: string[]) =>
  Array.from(
    new Set(
      targets
        .concat(canonicalSeeds)
        .filter((href) => href.startsWith('/') && !href.startsWith('/api') && !href.startsWith('/_next')),
    ),
  ).sort();

const MAX_TARGETS = 7;
const targets = normaliseTargets(crawlTargets).slice(0, MAX_TARGETS);

const navResultsPath = path.join(process.cwd(), 'reports', 'nav-results.json');

const ensureReportsDir = () => {
  const dir = path.dirname(navResultsPath);
  fs.mkdirSync(dir, { recursive: true });
};

type CrawlResult = {
  target: string;
  status: number | null;
  heading: string | null;
  navigatedVia: 'linked' | 'direct';
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

const canonicalSet = new Set(canonicalSeeds.map((seed) => normalisePath(seed)));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetries = async (
  request: import('@playwright/test').APIRequestContext,
  path: string,
  attempts = 10,
  initialDelay = 1_000,
) => {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await request.get(`${baseUrl}${path}`);
      if (response.ok()) {
        return response;
      }
      lastError = new Error(`Unexpected status ${response.status()} for ${path}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(initialDelay * (attempt + 1));
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${path}`);
};

const collectLinkSources = async (request: import('@playwright/test').APIRequestContext) => {
  const sources = new Map<string, string>();

  for (const seed of canonicalSeeds) {
    let response: import('@playwright/test').APIResponse;
    try {
      response = await fetchWithRetries(request, seed);
    } catch (error) {
      continue;
    }
    const markup = await response.text();
    const hrefs = Array.from(markup.matchAll(/href="(\/[^"#?]*)"/g)).map((match) => match[1]);

    for (const href of hrefs) {
      const normalised = normalisePath(href);
      if (!sources.has(normalised)) {
        sources.set(normalised, seed);
      }
    }
  }

  return sources;
};

test.describe('navigation crawl', () => {
  test('crawl internal targets without 404s', async ({ context }) => {
    await sleep(2500);
    const linkSources = await collectLinkSources(context.request);
    const results: CrawlResult[] = [];

    const targetPage = await context.newPage();

    const fetchResults = await Promise.all(
      targets.map(async (target) => ({ target, response: await fetchWithRetries(context.request, target) })),
    );

    for (const { target, response } of fetchResults) {
      const status = response.status();
      let heading: string | null = null;

      if (canonicalSet.has(normalisePath(target))) {
        await targetPage.goto(`${baseUrl}${target}`, {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        });
        heading = await captureHeading(targetPage);
      }

      const via = linkSources.has(normalisePath(target)) ? 'linked' : 'direct';

      results.push({ target, status, heading, navigatedVia: via });
      expect(status, `${target} returned unexpected status`).toBeGreaterThanOrEqual(200);
      expect(status, `${target} returned unexpected status`).toBeLessThan(400);
    }

    await targetPage.close();

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
