#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const repoRoot = process.cwd();

const argMap = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  const [key, value] = arg.includes('=') ? arg.split('=') : [arg, process.argv[index + 1]];
  if (!arg.includes('=') && process.argv[index + 1]?.startsWith('--')) {
    argMap.set(key.slice(2), true);
    continue;
  }
  argMap.set(key.slice(2), value ?? true);
  if (!arg.includes('=') && value && !value.startsWith('--')) {
    index += 1;
  }
}

const baseUrl = (() => {
  const fromArg = argMap.get('base-url') ?? argMap.get('baseUrl');
  const raw = typeof fromArg === 'string' ? fromArg : process.env.LINK_AUDIT_BASE_URL;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim().replace(/\/$/, '');
  }
  return 'http://localhost:3000';
})();

const concurrency = (() => {
  const fromArg = argMap.get('concurrency');
  const raw = typeof fromArg === 'string' ? fromArg : process.env.LINK_AUDIT_CONCURRENCY;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 16) : 6;
})();

const staticSitemap = JSON.parse(readFileSync(join(repoRoot, 'routes', 'sitemap.static.json'), 'utf8'));
const staticRoutes = Array.isArray(staticSitemap.routes) ? staticSitemap.routes : [];

const fromOrphans = (() => {
  try {
    const report = JSON.parse(readFileSync(join(repoRoot, 'routes', 'orphans.json'), 'utf8'));
    if (Array.isArray(report.orphans)) {
      return new Set(report.orphans.filter((item) => typeof item?.path === 'string').map((item) => item.path));
    }
  } catch (error) {
    // ignore
  }
  return new Set();
})();

const results = [];
const queue = staticRoutes.slice();

async function worker(id) {
  while (queue.length) {
    const path = queue.shift();
    if (typeof path !== 'string') {
      continue;
    }

    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const startedAt = Date.now();
    try {
      const response = await fetch(url, { redirect: 'manual' });
      const durationMs = Date.now() - startedAt;
      results.push({
        path,
        url,
        status: response.status,
        ok: response.status < 400,
        durationMs,
        orphan: fromOrphans.has(path),
      });
      if (response.status >= 500) {
        await delay(200); // allow backend to recover between heavy failures
      }
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      results.push({
        path,
        url,
        status: null,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs,
        orphan: fromOrphans.has(path),
      });
    }
  }
}

async function main() {
  if (!staticRoutes.length) {
    console.error('link-audit: no routes found in routes/sitemap.static.json');
    process.exitCode = 1;
    return;
  }

  await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index + 1)));

  results.sort((a, b) => a.path.localeCompare(b.path));

  const failures = results.filter((result) => !result.ok);
  const orphanHits = results.filter((result) => result.orphan);

  console.log(`Link audit against ${baseUrl}`);
  console.log(`Checked ${results.length} routes with concurrency ${concurrency}.`);

  if (failures.length) {
    console.error(`\n❌ ${failures.length} routes failed health checks:`);
    for (const failure of failures) {
      const details = failure.status ? `${failure.status}` : failure.error ?? 'request failed';
      console.error(` - ${failure.path} → ${details}`);
    }
  } else {
    console.log('\n✅ All routes returned < 400 responses.');
  }

  if (orphanHits.length) {
    console.warn(`\n⚠️ ${orphanHits.length} routes are flagged as sitemap orphans.`);
  }

  const maxDuration = results.reduce((max, entry) => Math.max(max, entry.durationMs ?? 0), 0);
  const avgDuration =
    results.reduce((sum, entry) => sum + (entry.durationMs ?? 0), 0) / Math.max(results.length, 1);

  console.log(`\nFastest response: ${Math.min(...results.map((entry) => entry.durationMs ?? Infinity))} ms`);
  console.log(`Slowest response: ${maxDuration} ms`);
  console.log(`Average response: ${avgDuration.toFixed(1)} ms`);

  if (failures.length) {
    process.exitCode = 1;
  }
}

await main();
