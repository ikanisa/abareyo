import { withSentryConfig } from '@sentry/nextjs';

import './config/validated-env.mjs';
import { buildSecurityHeaders } from './config/security-headers.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Ensure local packages are transpiled in the Next.js build
  transpilePackages: ['@rayon/contracts', '@rayon/mobile-widgets'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  i18n: {
    locales: ['en', 'fr', 'rw'],
    defaultLocale: 'en',
    localeDetection: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: buildSecurityHeaders(process.env),
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

const configWithSentry = withSentryConfig(nextConfig, sentryOptions, sentryWebpackPluginOptions);

export default configWithSentry;
