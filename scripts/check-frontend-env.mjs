/**
 * Minimal preflight check for frontend/server env variables.
 * Usage: `node scripts/check-frontend-env.mjs`
 */

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
  console.error('Environment validation failed ❌');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
