export default () => ({
  app: {
    host: process.env.APP_HOST ?? '0.0.0.0',
    port: Number(process.env.APP_PORT ?? 5000),
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    baseUrl: process.env.BACKEND_BASE_URL ?? 'http://localhost:5000',
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
  },
});
