export default () => ({
  app: {
    host: process.env.APP_HOST ?? '0.0.0.0',
    port: Number(process.env.APP_PORT ?? 5000),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    baseUrl: process.env.BACKEND_BASE_URL ?? 'http://localhost:5000',
    env: process.env.NODE_ENV ?? 'development',
    logLevel: process.env.APP_LOG_LEVEL ?? 'info',
  },
  database: {
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/rayon',
    shadowUrl: process.env.DATABASE_SHADOW_URL ?? undefined,
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT,
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL,
    onboardingModel: process.env.OPENAI_ONBOARDING_MODEL ?? 'gpt-4.1-mini',
  },
  sms: {
    webhookToken: process.env.SMS_WEBHOOK_TOKEN,
    parserConfidenceThreshold: Number(process.env.SMS_PARSE_CONFIDENCE_THRESHOLD ?? 0.65),
  },
  payments: {
    mtnPayCode: process.env.MTN_MOMO_PAY_CODE ?? '0700XXXXXX',
    airtelPayCode: process.env.AIRTEL_MONEY_PAY_CODE ?? '0700XXXXXX',
  },
  admin: {
    apiToken: process.env.ADMIN_API_TOKEN,
    session: {
      cookieName: process.env.ADMIN_SESSION_COOKIE ?? 'admin_session',
      secret: process.env.ADMIN_SESSION_SECRET ?? 'change-me-admin-session',
      ttlHours: Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 24),
      cookieDomain: process.env.ADMIN_SESSION_COOKIE_DOMAIN ?? undefined,
    },
    defaultAccount: {
      email: process.env.ADMIN_DEFAULT_EMAIL,
      password: process.env.ADMIN_DEFAULT_PASSWORD,
      name: process.env.ADMIN_DEFAULT_NAME ?? 'System Admin',
    },
  },
  fan: {
    session: {
      cookieName: process.env.FAN_SESSION_COOKIE ?? 'fan_session',
      secret: process.env.FAN_SESSION_SECRET ?? 'change-me-fan-session',
      ttlHours: Number(process.env.FAN_SESSION_TTL_HOURS ?? 24 * 30),
      cookieDomain: process.env.FAN_SESSION_COOKIE_DOMAIN ?? undefined,
    },
  },
  metrics: {
    token: process.env.METRICS_TOKEN ?? '',
  },
});
