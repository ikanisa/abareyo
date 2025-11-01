#!/usr/bin/env node
/**
 * Host-Agnostic Guard
 * 
 * Prevents reintroduction of provider-specific hosting references (Vercel, Render).
 * Run in CI to ensure the codebase remains host-agnostic.
 * 
 * Exit codes:
 * - 0: No violations found
 * - 1: Provider-specific references detected
 */

import { readFileSync, readdirSync } from 'fs';
import { join, relative, sep } from 'path';

const ROOT = process.cwd();
const exts = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.mjs',
  '.cjs',
]);
const extensionList = Array.from(exts);

// Banned patterns - case insensitive
const banned = [
  /@vercel\//i, // @vercel/ packages
  /\bvercel\.app\b/i, // vercel.app domains
  /\bvercel\.json\b/i, // vercel.json config
  /render\.ya?ml/i, // render.yaml or render.yml config
  /\bonrender\b/i, // onrender references
  /onrender\.com/i, // onrender.com domains
  /render\.com/i, // render.com domains
  /\bRENDER_[A-Z_]+/i, // RENDER_* env vars
  /\bVERCEL_[A-Z_]+/i, // VERCEL_* env vars
];

// Allowlist patterns to reduce false positives
const allowlist = [
  /render\s+prop/i,                    // React render prop pattern
  /universal\s+rendering/i,            // SSR/rendering concepts
  /server.*rendering/i,                // Server-side rendering
  /client.*rendering/i,                // Client-side rendering
  /rendering\s+engine/i,               // Generic rendering engine
  /to\s+render/i,                      // "to render" verb
  /will\s+render/i,                    // "will render" verb
  /can\s+render/i,                     // "can render" verb
  /should\s+render/i,                  // "should render" verb
  /does\s+render/i,                    // "does render" verb
  /pre.*render/i,                      // Pre-rendering
  /re.*render/i,                       // Re-rendering
  /@sentry\/vercel-edge/i,             // Historical reference to removed Sentry edge adapter
  /sentry.*vercel.*edge/i,             // Legacy documentation references
  /host-agnostic-guard/i,              // This guard script itself
  /hosting.*migration/i,               // Migration documentation
  /vercel.*cleanup/i,                  // Cleanup documentation
  /render.*cleanup/i,                  // Cleanup documentation
  /NOT FOUND/i,                        // Inventory reports showing absence
  /NONE in package/i,                  // Inventory reports showing absence
  /already clean/i,                    // Documentation about cleanup
  /no.*vercel/i,                       // Documentation about absence
  /no.*render/i,                       // Documentation about absence
  /reports\/cleanup\//i,               // Cleanup reports directory
  /package imports/i,                  // Documentation about imports
  /guard.*prevent/i,                   // Guard script documentation
  /script runs in ci to prevent/i,    // Documentation about prevention
];

// Directories to skip
const skipDirNames = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  '.expo',
  '.cache',
  '.render',
  '.vercel',
  'coverage',
  'dist',
  'out',
  'build',
  '_quarantine',
]);

const skipPathPatterns = [/^reports\/cleanup\//];

interface Violation {
  file: string;
  line: number;
  content: string;
}

const violations: Violation[] = [];

/**
 * Walk directory tree and scan files for banned patterns
 */
function walk(currentPath: string) {
  let entries;

  try {
    entries = readdirSync(currentPath, { withFileTypes: true });
  } catch (err) {
    return; // Skip unreadable directories
  }

  for (const entry of entries) {
    if (skipDirNames.has(entry.name)) continue;
    if (entry.isSymbolicLink()) continue;

    const entryPath = join(currentPath, entry.name);
    const relativePath = toPosix(relative(ROOT, entryPath));

    if (skipPathPatterns.some(pattern => pattern.test(relativePath))) {
      continue;
    }

    if (entry.isDirectory()) {
      walk(entryPath);
      continue;
    }

    if (entry.isFile() && shouldScanFile(relativePath)) {
      scanFile(entryPath, relativePath);
    }
  }
}

/**
 * Scan a single file for violations
 */
function shouldScanFile(relativePath: string): boolean {
  if (relativePath === 'scripts/host_agnostic_guard.ts') return false;

  const hasValidExtension = extensionList.some(ext => relativePath.endsWith(ext));
  if (!hasValidExtension) return false;

  return true;
}

function scanFile(filePath: string, relativePath: string) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      if (allowlist.some(rx => rx.test(line))) return;

      for (const bannedPattern of banned) {
        if (bannedPattern.test(line)) {
          violations.push({
            file: relativePath,
            line: idx + 1,
            content: line.trim().slice(0, 120),
          });
          break;
        }
      }
    });
  } catch (err) {
    // Skip unreadable files (binary, permissions, etc.)
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Running host-agnostic guard...\n');

  walk(ROOT);

  if (violations.length === 0) {
    console.log('✅ No provider-specific references found.');
    console.log('   Repository is host-agnostic.');
    process.exit(0);
  }
  
  console.error('❌ Host-agnostic guard failed!\n');
  console.error('Found provider-specific references (Vercel/Render) in:\n');
  
  violations.forEach(v => {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.content}`);
    console.error('');
  });
  
  console.error(`Total violations: ${violations.length}`);
  console.error('\nRemove these references to keep the codebase host-agnostic.');
  process.exit(1);
}

main();

function toPosix(path: string): string {
  return path.split(sep).join('/');
}
