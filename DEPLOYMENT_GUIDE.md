# Rayon Sports Platform - Netlify Deployment Guide

## Prerequisites

- Node.js 20.x (specified in `.nvmrc`)
- npm 11.4.2 or compatible
- Netlify CLI installed globally: `npm install -g netlify-cli`
- Netlify account with appropriate permissions
- Supabase project configured

## Environment Variables

### Required Public Variables (Exposed to Browser)

Set these in Netlify dashboard under **Site settings > Environment variables**:

```bash
NEXT_PUBLIC_SITE_URL=https://your-app.netlify.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=https://your-backend.netlify.app
```

### Required Private Variables (Server-side only)

```bash
SITE_SUPABASE_URL=https://your-project.supabase.co
SITE_SUPABASE_SECRET_KEY=your-service-role-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ONBOARDING_API_TOKEN=your-onboarding-token
OPENAI_API_KEY=your-openai-key
```

### Optional Variables

```bash
NEXT_TELEMETRY_DISABLED=1
APP_ENABLE_CSP=1
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NODE_ENV=production
```

## Local Development with Netlify CLI

1. Clone the repository:
```bash
git clone https://github.com/ikanisa/abareyo.git
cd abareyo
```

2. Install dependencies:
```bash
npm ci
```

3. Create `.env.local` file with required environment variables (copy from `.env.example`):
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. Link to your Netlify site:
```bash
netlify link
```

5. Start development server:
```bash
npm run dev
# or use Netlify dev for full Netlify environment
netlify dev
```

## Deployment Methods

### Method 1: Continuous Deployment (Recommended)

1. Connect your GitHub repository to Netlify:
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Select your repository
   - Configure build settings:
     - **Build command**: `npm run build:netlify`
     - **Publish directory**: `.next`
     - **Functions directory**: `netlify/functions`

2. Set environment variables in Netlify dashboard

3. Push to main branch - automatic deployment will trigger

### Method 2: Manual Deployment via CLI

1. Build the project:
```bash
npm run build:netlify
```

2. Deploy to Netlify:
```bash
netlify deploy --prod
```

### Method 3: Deploy from Local Machine

```bash
# Build and deploy in one command
npm run build:netlify && netlify deploy --prod --dir=.next
```

## Build Process

The Netlify build process follows these steps:

1. **Preflight checks** - Validates environment and dependencies
2. **Package builds** - Builds `@rayon/contracts` and other workspace packages
3. **Next.js build** - Creates optimized production build
4. **Post-build tasks** - Validates build artifacts and PWA configuration

## PWA Configuration

The platform is configured as a Progressive Web App with:

- **Manifest**: `/public/manifest.json`
- **Service Worker**: `/public/service-worker.js`
- **Offline Support**: `/public/offline.html`
- **Icons**: 192x192 and 512x512 PNG icons in `/public`

To test PWA functionality locally:
```bash
npm run build
npm run start
# Open Chrome DevTools > Application > Service Workers
```

## Android APK Build

### Prerequisites for APK Build

- Android Studio installed
- Java 17 (Temurin distribution recommended)
- Android SDK configured

### Building APK Locally

```bash
# Automated build script
node scripts/build-apk.mjs
```

### APK Build Steps

1. Clean previous builds
2. Build Next.js with Capacitor output
3. Sync Capacitor with Android project
4. Build Android release APK using Gradle

APK output location: `android/app/build/outputs/apk/release/app-release.apk`

## Netlify Functions

API routes are migrated to Netlify Functions for serverless execution.

### Creating New Functions

1. Create TypeScript file in `netlify/functions/`:
```typescript
// netlify/functions/my-function.ts
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from Netlify Function' }),
  };
};
```

2. Functions are automatically deployed with your site

### Testing Functions Locally

```bash
netlify dev
# Functions available at: http://localhost:8888/.netlify/functions/function-name
```

## Troubleshooting

### Build Fails with "Missing environment variables"

Ensure all required environment variables are set in Netlify dashboard.

### PWA Not Installing

1. Check manifest.json is accessible at `/manifest.json`
2. Verify service worker is registered
3. Test in Chrome DevTools > Application > Manifest

### APK Build Fails

1. Ensure Java 17 is installed: `java -version`
2. Check Android SDK is configured
3. Clean build: `rm -rf android/app/build && node scripts/build-apk.mjs`

### Functions Not Working

1. Check function syntax and exports
2. Verify environment variables are available
3. Check Netlify function logs in dashboard

## CI/CD Pipeline

The GitHub Actions workflow `.github/workflows/netlify-deploy.yml` handles:

1. **Linting** - ESLint checks
2. **Type checking** - TypeScript compilation
3. **Unit tests** - Vitest test suite
4. **Build** - Next.js production build
5. **Deployment** - Automatic deploy to Netlify
6. **APK Build** (on main branch) - Android APK artifact

## Monitoring and Logs

### View Deployment Logs

```bash
netlify logs
```

### View Function Logs

```bash
netlify functions:log function-name
```

### Netlify Dashboard

Monitor deployments, functions, and analytics in the Netlify dashboard.

## Performance Optimization

The deployment is optimized for performance:

- **Static Generation** - Pages are pre-rendered at build time
- **Image Optimization** - Next.js Image component with AVIF/WebP
- **Edge Caching** - Static assets cached at CDN edge
- **Code Splitting** - Automatic code splitting by Next.js
- **Compression** - Gzip/Brotli compression enabled

## Security

Security headers are configured in `netlify.toml`:

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

Additional security via Next.js configuration in `next.config.mjs`.

## Support

For issues or questions:

1. Check this guide and troubleshooting section
2. Review Netlify documentation: https://docs.netlify.com
3. Check GitHub Actions logs for CI/CD issues
4. Contact DevOps team for environment variable access

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
