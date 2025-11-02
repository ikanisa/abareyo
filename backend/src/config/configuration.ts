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
  supabase: {
    url: process.env.SITE_SUPABASE_URL ?? process.env.SUPABASE_URL,
    serviceRoleKey:
      process.env.SITE_SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY,
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
  otp: {
    redisPrefix: process.env.OTP_REDIS_PREFIX ?? 'otp',
    ttlSeconds: Number(process.env.OTP_TTL_SECONDS ?? 600),
    codeLength: Number(process.env.OTP_CODE_LENGTH ?? 6),
    rateLimits: {
      windowSeconds: Number(process.env.OTP_RATE_WINDOW_SECONDS ?? 900),
      maxPerPhone: Number(process.env.OTP_RATE_MAX_PER_PHONE ?? 5),
      maxPerIp: Number(process.env.OTP_RATE_MAX_PER_IP ?? 15),
      cooldownSeconds: Number(process.env.OTP_COOLDOWN_SECONDS ?? 60),
      verifyWindowSeconds: Number(process.env.OTP_VERIFY_WINDOW_SECONDS ?? 900),
      maxVerifyAttempts: Number(process.env.OTP_VERIFY_MAX_ATTEMPTS ?? 5),
    },
    blacklists: {
      phone: (process.env.OTP_BLOCKED_NUMBERS ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      ip: (process.env.OTP_BLOCKED_IPS ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    },
    whatsappTemplate: {
      name: process.env.OTP_WHATSAPP_TEMPLATE_NAME ?? 'fan_otp',
      namespace: process.env.OTP_WHATSAPP_TEMPLATE_NAMESPACE ?? '',
      locale: process.env.OTP_WHATSAPP_TEMPLATE_LOCALE ?? 'en',
      approved: ['1', 'true', 'yes'].includes(
        (process.env.OTP_WHATSAPP_TEMPLATE_APPROVED ?? '').toLowerCase(),
      ),
      rateLimitApproval: process.env.OTP_WHATSAPP_RATE_LIMIT_DOC ?? '',
    },
  },
});
