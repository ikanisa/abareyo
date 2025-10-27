#!/usr/bin/env node
/**
 * Security scanner to detect server-only environment variable names
 * in client-facing code directories.
 *
 * Scans app/, src/, and public/ for references to server-only secrets
 * that should never be exposed to the browser bundle.
 *
 * Usage: node tools/scripts/check-client-secrets.mjs
 * Exit code: 0 if clean, 1 if violations found
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..', '..');

// Server-only secret names that must NEVER appear in client code
const SERVER_ONLY_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SITE_SUPABASE_SECRET_KEY',
  'OPENAI_API_KEY',
  'ADMIN_SESSION_SECRET',
  'FAN_SESSION_SECRET',
  'ONBOARDING_API_TOKEN',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_SECRET_KEY',
  'AUTOMATION_BYPASS_SECRET',
  'METRICS_TOKEN',
  'DATABASE_URL',
  'REDIS_URL',
];

// Directories to scan for client-facing code
// Excludes: API routes (server-only) and lib/server (server-only)
const CLIENT_DIRS = ['app', 'src', 'public'];

// Additional paths to skip within CLIENT_DIRS (server-only code)
const SERVER_ONLY_PATHS = [
  /app\/api\//,           // Next.js API routes (server-only)
  /src\/lib\/server\//,   // Explicitly server-only utilities
  /src\/services\/admin\//,// Admin services (server-only)
  /src\/integrations\/supabase\/env\.ts/, // Server environment config
  /middleware\.ts$/,      // Next.js middleware (server-only)
  /instrumentation\.ts$/, // Next.js instrumentation (server-only)
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.html', '.md'];

// Patterns to ignore (build artifacts, dependencies, etc.)
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /dist/,
  /build/,
  /\.git/,
  /__tests__/,
  /\.test\./,
  /\.spec\./,
];

/**
 * Recursively scan directory for files
 */
async function* scanDirectory(dirPath) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = relative(ROOT, fullPath);

      // Skip ignored patterns
      if (IGNORE_PATTERNS.some((pattern) => pattern.test(relativePath))) {
        continue;
      }

      // Skip server-only paths
      if (SERVER_ONLY_PATHS.some((pattern) => pattern.test(relativePath))) {
        continue;
      }

      if (entry.isDirectory()) {
        yield* scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = entry.name.substring(entry.name.lastIndexOf('.'));
        if (SCAN_EXTENSIONS.includes(ext)) {
          yield fullPath;
        }
      }
    }
  } catch (error) {
    // Skip directories that don't exist or can't be read
    if (error.code !== 'ENOENT' && error.code !== 'EACCES') {
      console.warn(`Warning: Could not scan ${dirPath}: ${error.message}`);
    }
  }
}

/**
 * Scan file content for server-only secret references
 */
async function scanFile(filePath) {
  const relativePath = relative(ROOT, filePath);
  const violations = [];

  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for each server-only secret
      for (const secret of SERVER_ONLY_SECRETS) {
        // Look for the secret name as a string literal or identifier
        const patterns = [
          new RegExp(`['"\`]${secret}['"\`]`, 'g'), // String literal
          new RegExp(`\\b${secret}\\b`, 'g'), // Identifier/word boundary
        ];

        for (const pattern of patterns) {
          if (pattern.test(line)) {
            // Skip comments and documentation
            const trimmed = line.trim();
            if (
              trimmed.startsWith('//') ||
              trimmed.startsWith('*') ||
              trimmed.startsWith('/*') ||
              trimmed.startsWith('#')
            ) {
              continue;
            }

            violations.push({
              file: relativePath,
              line: lineNumber,
              secret,
              content: line.trim(),
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read ${relativePath}: ${error.message}`);
  }

  return violations;
}

/**
 * Main scanner
 */
async function main() {
  console.log('🔍 Scanning for server-only secrets in client code...\n');

  const allViolations = [];

  for (const dir of CLIENT_DIRS) {
    const dirPath = join(ROOT, dir);
    console.log(`Scanning ${dir}/...`);

    let fileCount = 0;
    for await (const filePath of scanDirectory(dirPath)) {
      fileCount++;
      const violations = await scanFile(filePath);
      allViolations.push(...violations);
    }

    console.log(`  ✓ Scanned ${fileCount} files\n`);
  }

  if (allViolations.length === 0) {
    console.log('✅ No server-only secrets found in client code!\n');
    return 0;
  }

  console.log('❌ SECURITY VIOLATIONS DETECTED:\n');
  console.log(
    `Found ${allViolations.length} reference(s) to server-only secrets in client code:\n`,
  );

  // Group by file
  const byFile = {};
  for (const violation of allViolations) {
    if (!byFile[violation.file]) {
      byFile[violation.file] = [];
    }
    byFile[violation.file].push(violation);
  }

  for (const [file, violations] of Object.entries(byFile)) {
    console.log(`📁 ${file}`);
    for (const v of violations) {
      console.log(`   Line ${v.line}: ${v.secret}`);
      console.log(`      ${v.content}`);
    }
    console.log();
  }

  console.log('Server-only secrets must NEVER appear in client code:');
  console.log('  - app/ (Next.js client components, routes)');
  console.log('  - src/ (shared utilities, client components)');
  console.log('  - public/ (static assets)');
  console.log('\nThese secrets should only be used in:');
  console.log('  - API routes (app/api/*)');
  console.log('  - Server components (with proper server-only imports)');
  console.log('  - Backend services (backend/*)');
  console.log('  - Middleware (middleware.ts with server-only guards)');
  console.log('\n');

  return 1;
}

main()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(2);
  });
