import { withSentryConfig } from '@sentry/nextjs';
import { withAxiom } from 'next-axiom';

import { buildSecurityHeaders } from './config/security-headers.mjs';

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
  typescript: {
    ignoreBuildErrors: true,
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

export default withAxiom(configWithSentry);
