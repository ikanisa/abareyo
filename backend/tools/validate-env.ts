/* Simple env validator for production readiness */
const required = [
  'DATABASE_URL',
  'REDIS_URL',
  'CORS_ORIGIN',
  'ADMIN_SESSION_SECRET',
  'FAN_SESSION_SECRET',
  'METRICS_TOKEN',
];

const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim().length === 0);

if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exitCode = 1;
} else {
  console.info('All required env vars present.');
}

// Optional recommendations
const optional = ['S3_ENDPOINT', 'S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
const missingOptional = optional.filter((k) => !process.env[k]);
if (missingOptional.length) {
  console.warn('Optional envs not set (ok if not using object storage):', missingOptional.join(', '));
}

const recommended = ['OPENAI_API_KEY'];
const missingRecommended = recommended.filter((k) => !process.env[k] || String(process.env[k]).trim().length === 0);
if (missingRecommended.length) {
  console.warn(
    'OpenAI integrations will be disabled until you configure:',
    missingRecommended.join(', '),
  );
}

