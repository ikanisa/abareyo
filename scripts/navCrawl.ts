import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const REPORTS_DIR = path.join(process.cwd(), 'reports');
const linkAuditPath = path.join(REPORTS_DIR, 'link-audit.json');
const outputPath = path.join(REPORTS_DIR, 'nav-results.json');

const baseUrl = 'http://localhost:3000';

const loadTargets = () => {
  try {
    const raw = fs.readFileSync(linkAuditPath, 'utf8');
    const parsed = JSON.parse(raw) as { summary?: { uniqueInternalTargets?: string[] } };
    return (parsed.summary?.uniqueInternalTargets ?? []).filter(
      (href) => href.startsWith('/') && !href.startsWith('/api') && !href.startsWith('/_next'),
    );
  } catch (error) {
    console.warn('Unable to parse link audit report', error);
    return ['/'];
  }
};

const extractHeading = (markup: string) => {
  const dom = new JSDOM(markup);
  const document = dom.window.document;
  const heading = document.querySelector('h1, h2');
  return heading?.textContent?.trim() ?? null;
};

const crawl = async (targets: string[]) => {
  const results: { target: string; status: number; heading: string | null }[] = [];
  for (const target of targets) {
    try {
      const response = await fetch(`${baseUrl}${target}`, { redirect: 'manual' });
      const status = response.status;
      const text = await response.text();
      results.push({ target, status, heading: extractHeading(text) });
    } catch (error) {
      console.error(`Failed to crawl ${target}`, error);
      results.push({ target, status: 0, heading: null });
    }
  }
  return results;
};

const run = async () => {
  const targets = loadTargets();
  console.log(`Crawling ${targets.length} targets from ${baseUrl}`);
  const results = await crawl(targets);
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl,
        results,
      },
      null,
      2,
    ),
  );
  console.log(`Navigation results written to ${outputPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
