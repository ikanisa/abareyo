#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('📦 Running post-build tasks for Netlify...');

// Ensure .next directory exists
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.warn('⚠️  Warning: .next directory not found. This is expected if build hasn\'t run yet.');
  process.exit(0);
}

console.log('✅ .next directory exists');

// Check for manifest.json in public directory
const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.warn('⚠️  Warning: public/manifest.json not found. PWA features may not work.');
} else {
  console.log('✅ PWA manifest found');
}

// Check for service worker
const swPath = path.join(process.cwd(), 'public', 'service-worker.js');
if (!fs.existsSync(swPath)) {
  console.warn('⚠️  Warning: public/service-worker.js not found. Offline support may not work.');
} else {
  console.log('✅ Service worker found');
}

// Validate build output
const standaloneDir = path.join(nextDir, 'standalone');
if (fs.existsSync(standaloneDir)) {
  console.log('✅ Standalone build output created');
}

console.log('✅ Post-build tasks completed successfully\n');
