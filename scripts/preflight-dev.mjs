import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

const require = createRequire(import.meta.url);

['.env', '.env.local'].forEach((file) => {
  const filePath = resolve(process.cwd(), file);
  if (existsSync(filePath)) {
    loadEnv({ path: filePath, override: false });
  }
});

const MIN_NODE = 20;
const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
if (Number.isNaN(nodeMajor) || nodeMajor < MIN_NODE) {
  console.error(`Node ${MIN_NODE}+ required. Detected ${process.versions.node}.`);
  process.exit(1);
}

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_BACKEND_URL',
];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  console.error('Populate .env.local (see .env.local.example).');
  process.exit(1);
}

console.log('Dev preflight passed. Starting Next.js...');
