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

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml', '.mjs', '.cjs'];

// Banned patterns - case insensitive
const banned = [
  /@vercel\//i,           // @vercel/ packages
  /\bvercel\.app\b/i,     // vercel.app domains
  /\bvercel\.json\b/i,    // vercel.json config
  /\bonrender\b/i,        // onrender references
  /render\.com/i,         // render.com domains
  /\bRENDER_[A-Z_]+/,                    // RENDER_* env vars
  /\bVERCEL_[A-Z_]+/,                    // VERCEL_* env vars
  /process\.env\.(?:VERCEL|RENDER)\b/i, // Direct process.env.VERCEL / process.env.RENDER usage
  /process\.env\[['"](?:VERCEL|RENDER)['"]\]/i, // Bracket access to VERCEL/RENDER envs
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
  /@sentry\/vercel-edge/i,             // Sentry transitive dependency (allowed)
  /sentry.*vercel.*edge/i,             // Sentry edge runtime references
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
const skipDirs = [
  'node_modules',
  '.git',
  '.next',
  'build',
  'coverage',
  '.expo',
  '.vercel',
  '.render',
  '_quarantine',
  'dist',
  'out',
  '.cache',
];

let violations: Array<{ file: string; line: number; content: string }> = [];

/**
 * Walk directory tree and scan files for banned patterns
 */
function walk(p: string) {
  const st = statSync(p);
  
  if (st.isDirectory()) {
    const dirName = p.split('/').pop() || '';
    if (skipDirs.includes(dirName)) return;
    
    for (const f of readdirSync(p)) {
      if (skipDirs.includes(f)) continue;
      walk(join(p, f));
    }
  } else if (exts.some(e => p.endsWith(e))) {
    scanFile(p);
  }
}

/**
 * Scan a single file for violations
 */
function scanFile(filePath: string) {
  // Skip the guard script itself and cleanup reports
  const relPath = relative(ROOT, filePath);
  if (relPath === 'scripts/host_agnostic_guard.ts' || 
      relPath.startsWith('reports/cleanup/')) {
    return;
  }
  
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, idx) => {
      // Skip if allowlisted
      if (allowlist.some(rx => rx.test(line))) return;
      
      // Check for banned patterns
      for (const bannedPattern of banned) {
        if (bannedPattern.test(line)) {
          violations.push({
            file: relative(ROOT, filePath),
            line: idx + 1,
            content: line.trim().substring(0, 100), // First 100 chars
          });
          break; // One violation per line is enough
        }
      }
    });
  } catch (err) {
    // Skip files that can't be read (binary, permissions, etc)
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
