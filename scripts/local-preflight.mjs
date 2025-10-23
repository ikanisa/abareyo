#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const run = (cmd, options = {}) => {
  execSync(cmd, { stdio: 'inherit', shell: true, ...options });
};

const rootDir = new URL('..', import.meta.url).pathname;
const requiredEnv = [
  'NEXT_PUBLIC_BACKEND_URL',
  'NEXT_PUBLIC_ENVIRONMENT_LABEL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SITE_SUPABASE_URL',
  'SITE_SUPABASE_SECRET_KEY',
  'ONBOARDING_API_TOKEN',
  'OPENAI_API_KEY',
];

const missing = requiredEnv.filter((key) => !process.env[key] || String(process.env[key]).trim().length === 0);
if (missing.length) {
  console.error('[ENV] Missing required variables:\n  - ' + missing.join('\n  - '));
  process.exit(1);
}

try {
  const nodeVersion = execSync('node -v', { encoding: 'utf8' }).trim();
  if (!nodeVersion.startsWith('v20')) {
    console.warn(`[ENV] Expected Node 20.x but found ${nodeVersion}`);
  }
} catch (error) {
  console.error('[ENV] Node.js not available');
  process.exit(1);
}

const pnpmLock = path.join(rootDir, 'pnpm-lock.yaml');
if (!fs.existsSync(pnpmLock)) {
  console.error('[ENV] pnpm-lock.yaml not found; install cannot proceed');
  process.exit(1);
}

try {
  run('corepack enable');
} catch (error) {
  console.warn('[ENV] corepack enable failed (continuing)');
}

try {
  run('pnpm install --frozen-lockfile');
} catch (error) {
  console.error('[PREP] pnpm install failed');
  process.exit(1);
}

try {
  run('pnpm typecheck');
} catch (error) {
  console.error('[PREP] pnpm typecheck failed');
  process.exit(1);
}

try {
  run('pnpm lint');
} catch (error) {
  console.error('[PREP] pnpm lint failed');
  process.exit(1);
}

try {
  run('pnpm build');
} catch (error) {
  console.error('[PREP] pnpm build failed');
  process.exit(1);
}

try {
  run('node scripts/check-backend-endpoint.mjs');
} catch (error) {
  console.error('[PREP] Backend endpoint verification failed');
  process.exit(1);
}

console.log('Preflight PASS');
