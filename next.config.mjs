import { createRequire } from 'module';
import { withSentryConfig } from '@sentry/nextjs';

const require = createRequire(import.meta.url);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const TELEMETRY_URL = process.env.NEXT_PUBLIC_TELEMETRY_URL;
const isProd = process.env.NODE_ENV === 'production';

const normaliseOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch (error) {
    return null;
  }
};

const connectSources = new Set(["'self'", 'https://*.ingest.sentry.io', 'https://api.axiom.co']);
const backendOrigin = BACKEND_URL ? normaliseOrigin(BACKEND_URL) : null;
const telemetryOrigin = TELEMETRY_URL ? normaliseOrigin(TELEMETRY_URL) : null;
const siteOrigin = SITE_URL ? normaliseOrigin(SITE_URL) : null;

if (backendOrigin) {
  connectSources.add(backendOrigin);
}

if (telemetryOrigin) {
  connectSources.add(telemetryOrigin);
}

if (siteOrigin) {
  connectSources.add(siteOrigin);
}

const buildContentSecurityPolicy = () => {
  const policy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${Array.from(connectSources).join(' ')}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ];

  return policy.join('; ');
};

const buildSecurityHeaders = () => {
  const headers = [
    {
      key: 'Content-Security-Policy',
      value: buildContentSecurityPolicy(),
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()',
    },
  ];

  if (isProd) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }

  return headers;
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure local package '@rayon/contracts' is transpiled in Next.js build
  transpilePackages: ['@rayon/contracts'],
  i18n: {
    locales: ['en', 'fr', 'rw'],
    defaultLocale: 'en',
    localeDetection: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: buildSecurityHeaders(),
      },
    ];
  },
};

const sentryOptions = {
  silent: true,
};

const sentryWebpackPluginOptions = {
  hideSourcemaps: true,
};

export default withSentryConfig(nextConfig, sentryOptions, sentryWebpackPluginOptions);
