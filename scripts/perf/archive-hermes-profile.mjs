#!/usr/bin/env node

import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , sourcePathArg, profileLabel] = process.argv;

if (!sourcePathArg) {
  console.error('Usage: node scripts/perf/archive-hermes-profile.mjs <profile-path> [label]');
  process.exit(1);
}

const sourcePath = resolve(process.cwd(), sourcePathArg);
const timestamp = new Date().toISOString().replace(/[:]/g, '-');
const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(scriptDir, '..', '..');
const destinationDir = resolve(repoRoot, 'reports', 'refactor', 'perf', 'mobile');

await mkdir(destinationDir, { recursive: true });

const baseName = profileLabel ? `${profileLabel}${extname(sourcePath) || '.cpuprofile'}` : basename(sourcePath);
const destinationPath = resolve(destinationDir, `${timestamp}-${baseName}`);

await copyFile(sourcePath, destinationPath);

const metadataPath = `${destinationPath}.json`;
const metadata = {
  archivedAt: new Date().toISOString(),
  destinationPath,
  sourcePath,
};
await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

console.log(`[perf] Archived Hermes profile to ${destinationPath}`);
console.log(`[perf] Metadata written to ${metadataPath}`);
