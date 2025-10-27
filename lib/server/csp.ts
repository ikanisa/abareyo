/**
 * Content Security Policy (CSP) helper for Abareyo
 *
 * Provides centralized CSP directive management to prevent XSS and injection attacks.
 *
 * SECURITY BEST PRACTICES:
 * - Avoid 'unsafe-inline' for scripts and styles in production
 * - Use nonces or hashes for inline scripts/styles when possible
 * - Restrict sources to trusted domains only
 * - Test thoroughly in development before deploying
 *
 * INTEGRATION INSTRUCTIONS:
 * 1. Use in middleware.ts to set CSP headers on all responses
 * 2. Generate nonces per-request for inline scripts/styles
 * 3. Pass nonces to components via context or props
 * 4. Add nonce attribute to inline <script> and <style> tags
 *
 * Example middleware integration:
 * ```typescript
 * import { generateCSPHeader, generateNonce } from '@/lib/server/csp';
 *
 * export function middleware(request: NextRequest) {
 *   const nonce = generateNonce();
 *   const response = NextResponse.next();
 *
 *   const cspHeader = generateCSPHeader({ nonce });
 *   response.headers.set('Content-Security-Policy', cspHeader);
 *
 *   return response;
 * }
 * ```
 *
 * Example component usage with nonce:
 * ```tsx
 * // In layout or page (server component):
 * import { headers } from 'next/headers';
 *
 * export default function RootLayout({ children }) {
 *   const nonce = headers().get('x-nonce');
 *
 *   return (
 *     <html>
 *       <head>
 *         <script nonce={nonce} dangerouslySetInnerHTML={{ __html: '...' }} />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */

import { randomBytes } from 'crypto';

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'frame-src'?: string[];
  'object-src'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'upgrade-insecure-requests'?: boolean;
}

export interface CSPOptions {
  /**
   * Per-request nonce for inline scripts and styles.
   * Generate with generateNonce() for each request.
   */
  nonce?: string;

  /**
   * Development mode allows 'unsafe-eval' for hot reloading.
   * Should be false in production.
   */
  isDevelopment?: boolean;

  /**
   * Custom directives to merge with defaults
   */
  customDirectives?: Partial<CSPDirectives>;
}

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

/**
 * Get default CSP directives for Abareyo
 */
export function getDefaultDirectives(options: CSPOptions = {}): CSPDirectives {
  const { nonce, isDevelopment = false } = options;

  const scriptSrc = ["'self'"];
  const styleSrc = ["'self'"];

  // Add nonce if provided (preferred method)
  if (nonce) {
    scriptSrc.push(`'nonce-${nonce}'`);
    styleSrc.push(`'nonce-${nonce}'`);
  }

  // Development mode: allow unsafe-eval for hot reloading
  // TODO: Remove in production or use nonces for all inline code
  if (isDevelopment) {
    scriptSrc.push("'unsafe-eval'");
  }

  // TEMPORARY: unsafe-inline allowed during migration period
  // TODO: Remove after implementing nonces/hashes for all inline scripts/styles
  // Track removal: https://github.com/ikanisa/abareyo/issues/XXX
  scriptSrc.push("'unsafe-inline'");
  styleSrc.push("'unsafe-inline'");

  return {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    'style-src': styleSrc,
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:', // Allow HTTPS images from any source (can be restricted further)
    ],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      // Add Supabase, Sentry, and other API endpoints here
      'https://*.supabase.co',
      'https://api.openai.com',
      'https://sentry.io',
      'https://*.sentry.io',
    ],
    'frame-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': !isDevelopment,
  };
}

/**
 * Generate CSP header string from directives
 */
export function generateCSPHeader(options: CSPOptions = {}): string {
  const directives = {
    ...getDefaultDirectives(options),
    ...options.customDirectives,
  };

  const parts: string[] = [];

  for (const [key, value] of Object.entries(directives)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'boolean') {
      if (value) {
        parts.push(key);
      }
    } else if (Array.isArray(value)) {
      parts.push(`${key} ${value.join(' ')}`);
    }
  }

  return parts.join('; ');
}

/**
 * Generate CSP header for report-only mode (testing)
 *
 * Use this to test CSP changes without breaking the app.
 * Reports violations to report-uri without blocking.
 */
export function generateReportOnlyCSPHeader(
  options: CSPOptions & { reportUri?: string } = {},
): string {
  const csp = generateCSPHeader(options);

  if (options.reportUri) {
    return `${csp}; report-uri ${options.reportUri}`;
  }

  return csp;
}

/**
 * Middleware helper to add CSP headers to response
 *
 * Example:
 * ```typescript
 * import { NextResponse } from 'next/server';
 * import { addCSPHeaders, generateNonce } from '@/lib/server/csp';
 *
 * export function middleware(request: NextRequest) {
 *   const nonce = generateNonce();
 *   const response = NextResponse.next();
 *
 *   addCSPHeaders(response, { nonce });
 *   response.headers.set('x-nonce', nonce); // Pass nonce to app
 *
 *   return response;
 * }
 * ```
 */
export function addCSPHeaders(
  response: Response,
  options: CSPOptions & { reportOnly?: boolean } = {},
): void {
  const headerName = options.reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  const cspHeader = generateCSPHeader(options);
  response.headers.set(headerName, cspHeader);
}

/**
 * Get CSP meta tag for HTML injection
 *
 * Use this if you can't set headers (e.g., static export).
 * Note: meta tags don't support all CSP features (e.g., frame-ancestors).
 */
export function getCSPMetaTag(options: CSPOptions = {}): string {
  const cspHeader = generateCSPHeader(options);
  return `<meta http-equiv="Content-Security-Policy" content="${cspHeader.replace(/"/g, '&quot;')}" />`;
}
