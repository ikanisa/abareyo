#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('📱 Building Android APK...\n');

// Note: This script is optimized for Unix-like environments (Linux/macOS)
// For Windows, use WSL or Git Bash, or adapt commands for PowerShell
const isWindows = process.platform === 'win32';
const gradlewCmd = isWindows ? 'gradlew.bat' : './gradlew';

const steps = [
  {
    name: 'Clean previous builds',
    command: isWindows 
      ? 'rmdir /s /q dist 2>nul & rmdir /s /q android\\app\\build 2>nul'
      : 'rm -rf dist && rm -rf android/app/build',
  },
  {
    name: 'Build Next.js for Capacitor',
    command: 'npm run build:capacitor',
  },
  {
    name: 'Sync Capacitor',
    command: 'npx cap sync android',
  },
  {
    name: 'Build Android APK',
    command: `cd android && ${gradlewCmd} assembleRelease`,
  },
];

try {
  for (const step of steps) {
    console.log(`\n🔨 ${step.name}...`);
    execSync(step.command, { stdio: 'inherit', shell: true });
    console.log(`✅ ${step.name} completed`);
  }

  const apkPath = path.join(
    __dirname,
    '..',
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    'release',
    'app-release.apk'
  );

  if (fs.existsSync(apkPath)) {
    console.log('\n✅ APK build successful!');
    console.log(`📦 APK location: ${apkPath}`);
  } else {
    console.warn('\n⚠️  APK file not found at expected location');
  }
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
