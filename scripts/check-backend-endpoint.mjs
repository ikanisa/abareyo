#!/usr/bin/env node
import process from 'node:process';

const allowMissingEnv = ['1', 'true', 'yes'].includes(
  (process.env.PREFLIGHT_ALLOW_MISSING_ENV ?? '').toLowerCase(),
);

let clientEnv;
try {
  ({ clientEnv } = await import('../config/validated-env.mjs'));
} catch (error) {
  if (allowMissingEnv) {
    console.warn('[backend] Skipping backend endpoint verification.');
    console.warn(
      error instanceof Error ? error.message : `Unexpected error: ${String(error)}`,
    );
    console.warn(
      'Set PREFLIGHT_ALLOW_MISSING_ENV=0 (default) to restore strict validation.',
    );
    process.exit(0);
  }

  console.error('[backend] Unable to resolve validated environment.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const rawUrl = clientEnv.NEXT_PUBLIC_BACKEND_URL?.trim();

if (!rawUrl) {
  console.warn('[backend] NEXT_PUBLIC_BACKEND_URL is not set; skipping endpoint verification.');
  process.exit(0);
}

if (rawUrl.startsWith('/')) {
  console.info('[backend] NEXT_PUBLIC_BACKEND_URL is relative; assuming Next.js proxy.');
  process.exit(0);
}

let healthPaths = ['/api/health', '/health', '/'];
const overridePath = process.argv[2];
if (overridePath) {
  healthPaths = [overridePath];
}

let parsedUrl;
try {
  parsedUrl = new URL(rawUrl);
} catch (error) {
  console.error(`[backend] Invalid NEXT_PUBLIC_BACKEND_URL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

async function probe(pathname) {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const basePath = parsedUrl.pathname.replace(/\/$/, '');
  const candidates = [new URL(normalized, parsedUrl)];

  if (basePath && !normalized.startsWith(basePath)) {
    const combined = `${basePath}${normalized}`.replace(/\/{2,}/g, '/');
    candidates.push(new URL(parsedUrl.origin + combined));
  }

  let lastFailure = null;

  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(candidate, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        redirect: 'follow',
      });

      if (response.ok) {
        return { ok: true, status: response.status, url: candidate.toString() };
      }

      lastFailure = { ok: false, status: response.status, url: candidate.toString() };
    } catch (error) {
      lastFailure = { ok: false, error, url: candidate.toString() };
    }
  }

  return lastFailure ?? { ok: false, error: new Error('No candidate URLs attempted'), url: normalized };
}

let success = null;
const failures = [];
for (const path of healthPaths) {
  // eslint-disable-next-line no-await-in-loop
  const result = await probe(path);
  if (result.ok) {
    success = result;
    break;
  }
  failures.push(result);
}

clearTimeout(timeout);

if (success) {
  console.info(`[backend] Verified backend endpoint via ${success.url} (status ${success.status}).`);
  process.exit(0);
}

console.error('[backend] Unable to verify backend endpoint. Attempts:');
for (const failure of failures) {
  if ('error' in failure && failure.error) {
    console.error(`  - ${failure.url}: ${(failure.error instanceof Error ? failure.error.message : failure.error)}`);
  } else {
    console.error(`  - ${failure.url}: HTTP ${failure.status}`);
  }
}
process.exit(1);
