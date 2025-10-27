# Security Hardening Changes

This document describes the security hardening changes made to the Abareyo application.

## Overview

These changes address high-priority findings from the fullstack security review, focusing on preventing accidental exposure of server-only secrets to the client bundle.

## Changes Made

### 1. Environment Variable Documentation

**Files Modified:**
- `config/validated-env.mjs`
- `.env.example`
- `scripts/env-sync-template.sh`

**What Changed:**
- Added comprehensive comments in `validated-env.mjs` clearly marking which environment variables are server-only
- Updated `.env.example` with prominent warning sections separating client-safe from server-only variables
- Enhanced `env-sync-template.sh` with explicit warnings about never exposing server secrets with `NEXT_PUBLIC_` prefix

**Server-Only Secrets Identified:**
- `SUPABASE_SERVICE_ROLE_KEY` - Full admin access to Supabase
- `SITE_SUPABASE_SECRET_KEY` - Server-side Supabase secret
- `OPENAI_API_KEY` - OpenAI API authentication key
- `ADMIN_SESSION_SECRET` - Admin authentication session secret
- `FAN_SESSION_SECRET` - Fan authentication session secret
- `ONBOARDING_API_TOKEN` - Onboarding service authentication token
- `AUTOMATION_BYPASS_SECRET` - Automation bypass token
- Other service keys and tokens

### 2. Automated Secret Detection

**New File:** `tools/scripts/check-client-secrets.mjs`

A security scanner that automatically detects references to server-only environment variable names in client-facing code.

**How It Works:**
- Scans `app/`, `src/`, and `public/` directories
- Excludes server-only paths (API routes, lib/server, services/admin)
- Detects string literals and identifiers matching server-only secret names
- Exits with error code 1 if violations found (suitable for CI)

**Usage:**
```bash
node tools/scripts/check-client-secrets.mjs
```

**What It Catches:**
- Direct references to server-only env var names in client components
- String literals containing secret names
- Accidental usage in client-side utilities

**What It Ignores:**
- API routes (`app/api/`) - server-only by design
- Server utilities (`src/lib/server/`) - explicitly server-only
- Admin services (`src/services/admin/`) - server-only
- Comments and documentation
- Test files

### 3. CI Integration

**New File:** `.github/workflows/ci-secret-guard.yml`

A GitHub Actions workflow that runs on every push and pull request to prevent secret exposure.

**What It Does:**
1. **Secret Scan Job** - Runs `check-client-secrets.mjs` to detect violations
2. **Build Check Job** - Verifies the build succeeds and checks build output for leaked secrets

**How to View Results:**
- Check the "Checks" tab on pull requests
- Review "Secret Guard CI" workflow results
- Failures indicate either:
  - Server-only secrets found in client code (fix by removing references)
  - Build output contains secret names (fix by ensuring proper env var handling)

### 4. Content Security Policy (CSP) Helper

**New File:** `lib/server/csp.ts`

A comprehensive CSP helper module to centralize security policy management and prevent XSS attacks.

**Features:**
- Centralized CSP directive configuration
- Nonce generation for inline scripts/styles
- Development vs production mode support
- Report-only mode for testing
- Middleware integration helpers
- Detailed documentation and examples

**Current State:**
- `'unsafe-inline'` is temporarily allowed for scripts and styles during migration
- Includes TODO markers and instructions for migrating to nonce-based approach
- Ready for gradual adoption without breaking existing functionality

**How to Adopt:**

1. **Basic Integration (Report-Only Mode):**
```typescript
// middleware.ts
import { addCSPHeaders, generateNonce } from '@/lib/server/csp';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const nonce = generateNonce();
  
  addCSPHeaders(response, { 
    nonce, 
    reportOnly: true // Test without blocking
  });
  
  response.headers.set('x-nonce', nonce);
  return response;
}
```

2. **Using Nonces in Components:**
```tsx
// app/layout.tsx
import { headers } from 'next/headers';

export default function RootLayout({ children }) {
  const nonce = headers().get('x-nonce');
  
  return (
    <html>
      <head>
        <script 
          nonce={nonce} 
          dangerouslySetInnerHTML={{ __html: '...' }} 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

3. **Migration Path:**
   - Start with report-only mode to identify violations
   - Add nonces to inline scripts/styles incrementally
   - Remove `'unsafe-inline'` from CSP once all inline code uses nonces
   - Monitor for violations and adjust as needed

## Testing

### Manual Testing

1. **Run Secret Scanner:**
```bash
node tools/scripts/check-client-secrets.mjs
```
Expected: ✅ No server-only secrets found in client code!

2. **Verify Environment Config:**
```bash
node scripts/check-frontend-env.mjs
```
Expected: Environment looks good ✅

3. **Test Env Sync Script:**
```bash
OUTPUT_FILE=.env.test scripts/env-sync-template.sh
```
Expected: Prompts include warnings about server-only secrets

4. **Lint Check:**
```bash
npm run lint
```

5. **Type Check:**
```bash
npm run type-check
```

### CI Testing

The `ci-secret-guard.yml` workflow runs automatically on:
- Push to main
- Pull requests to main

View results in the "Actions" tab on GitHub.

## Migration Notes

### For Developers

**DO:**
- ✅ Use `NEXT_PUBLIC_*` prefix ONLY for values safe to expose to browsers
- ✅ Keep server secrets (API keys, tokens, etc.) without `NEXT_PUBLIC_` prefix
- ✅ Use server-only secrets only in:
  - API routes (`app/api/`)
  - Server components (with proper guards)
  - Server utilities (`src/lib/server/`)
  - Backend services
  - Middleware (with server-only guards)

**DON'T:**
- ❌ Never add `NEXT_PUBLIC_` prefix to server secrets
- ❌ Never reference server-only env vars in client components
- ❌ Never log or expose server secrets in client-visible responses
- ❌ Never commit secrets to source code

### For DevOps

**Environment Variable Management:**
1. Review all existing environment variables
2. Verify server-only secrets don't have `NEXT_PUBLIC_` equivalents
3. Update secret managers to align with new naming conventions
4. Monitor CI workflow results for violations

**CSP Adoption:**
1. Test CSP in report-only mode first
2. Review violation reports
3. Implement nonces for inline scripts/styles
4. Enable enforcement mode gradually
5. Monitor for issues in production

## Security Benefits

1. **Prevents Secret Exposure:**
   - Automated detection of server secrets in client code
   - Clear documentation preventing configuration mistakes
   - CI enforcement ensures violations don't reach production

2. **Defense in Depth:**
   - Multiple layers of protection (docs, scanner, CI)
   - Clear separation of client-safe vs server-only variables
   - Automated enforcement reduces human error

3. **XSS Protection:**
   - CSP framework ready for adoption
   - Migration path from unsafe-inline to nonces
   - Centralized policy management

4. **Maintainability:**
   - Clear documentation in code and configuration
   - Automated scanning reduces manual review burden
   - CI integration catches issues early

## Support and Questions

For questions or issues with these changes:
1. Review the documentation in each modified file
2. Check the inline comments in `config/validated-env.mjs`
3. Run the scanner locally to debug violations
4. Consult the CSP helper documentation in `lib/server/csp.ts`

## References

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Content Security Policy (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
