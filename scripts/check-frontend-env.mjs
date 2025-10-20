/**
 * Minimal preflight check for frontend/server env variables.
 * Usage: `node scripts/check-frontend-env.mjs`
 */

const requiredSingles = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_BACKEND_URL',
  'NEXT_PUBLIC_ENVIRONMENT_LABEL',
  'SITE_SUPABASE_URL',
  'SITE_SUPABASE_SECRET_KEY',
  'ONBOARDING_API_TOKEN',
  'NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN',
  'OPENAI_API_KEY',
];

const requiredAny = [
  { group: ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'], label: 'Supabase publishable key' },
  { group: ['NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_DSN'], label: 'Sentry DSN (client or server)' },
];

const missing = requiredSingles.filter((key) => !process.env[key] || String(process.env[key]).trim().length === 0);

for (const { group, label } of requiredAny) {
  const hasValue = group.some((key) => process.env[key] && String(process.env[key]).trim().length > 0);
  if (!hasValue) {
    missing.push(`${label} (${group.join(' or ')})`);
  }
}

if (missing.length) {
  console.error('Missing required environment variables:\n  - ' + missing.join('\n  - '));
  process.exitCode = 1;
} else {
  console.info('All required env vars present ✅');
}
