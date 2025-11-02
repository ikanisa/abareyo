import './config/validated-env.mjs';
import createNextPWA from 'next-pwa';
import { buildSecurityHeaders } from './config/security-headers.mjs';

const withPWA = createNextPWA({
  dest: 'public',
  sw: 'service-worker.js',
  customWorkerDir: 'workers',
  disable: process.env.NODE_ENV === 'development',
  register: false,
  skipWaiting: false,
  buildExcludes: [/middleware-manifest\.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Ensure local packages are transpiled in the Next.js build
  transpilePackages: ['@rayon/contracts', '@rayon/mobile-widgets'],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24,
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'gikundiro.com' },
      { protocol: 'https', hostname: 'www.gikundiro.com' },
      { protocol: 'https', hostname: 'assets.gikundiro.rw' },
      { protocol: 'https', hostname: '**.gikundiro.rw' },
      { protocol: 'https', hostname: 'placehold.co' },
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

export default withPWA(nextConfig);
