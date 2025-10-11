import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure local package '@rayon/contracts' is transpiled in Next.js build
  transpilePackages: ['@rayon/contracts'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    // Redirect locale-prefixed paths to root equivalents until locale routing is implemented
    return [
      { source: '/en', destination: '/', permanent: true },
      { source: '/en/:path*', destination: '/:path*', permanent: true },
      { source: '/rw', destination: '/', permanent: true },
      { source: '/rw/:path*', destination: '/:path*', permanent: true },
    ];
  },
  i18n: {
    locales: ['rw', 'en'],
    defaultLocale: 'rw',
  },
};

export default nextConfig;
