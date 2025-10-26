/**
 * Minimal preflight check for frontend/server env variables.
 * Usage: `node scripts/check-frontend-env.mjs`
 */

const allowMissingEnv = ['1', 'true', 'yes'].includes(
  (process.env.PREFLIGHT_ALLOW_MISSING_ENV ?? '').toLowerCase(),
);

try {
  const { clientEnv, serverEnv } = await import('../config/validated-env.mjs');
  const summary = {
    NEXT_PUBLIC_BACKEND_URL: clientEnv.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_SITE_URL: clientEnv.NEXT_PUBLIC_SITE_URL,
    NODE_ENV: serverEnv.NODE_ENV,
  };
  console.info('Environment looks good ✅');
  console.info(JSON.stringify(summary, null, 2));
} catch (error) {
  if (allowMissingEnv) {
    console.warn('Environment validation skipped ⚠️');
    console.warn(
      error instanceof Error ? error.message : `Unexpected error: ${String(error)}`,
    );
    console.warn(
      'Set PREFLIGHT_ALLOW_MISSING_ENV=0 (default) to restore strict validation.',
    );
  } else {
    console.error('Environment validation failed ❌');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
