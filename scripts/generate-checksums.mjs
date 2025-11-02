#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function printUsage() {
  console.error('Usage: node scripts/generate-checksums.mjs <output-file> <path> [path ...]');
}

const [, , outputArg, ...targets] = process.argv;

if (!outputArg || targets.length === 0) {
  printUsage();
  process.exit(1);
}

const outputFile = resolve(repoRoot, outputArg);

async function gatherFiles(target) {
  const files = [];
  const resolved = resolve(repoRoot, target);
  async function walk(current) {
    let info;
    try {
      info = await stat(current);
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        console.warn(`Skipping missing path: ${relative(repoRoot, current)}`);
        return;
      }
      throw error;
    }
    if (info.isDirectory()) {
      const entries = await readdir(current);
      for (const entry of entries) {
        await walk(resolve(current, entry));
      }
    } else if (info.isFile()) {
      files.push(current);
    }
  }
  await walk(resolved);
  return files;
}

async function hashFile(path) {
  const hash = createHash('sha256');
  const { default: fs } = await import('node:fs');
  await new Promise((resolvePromise, rejectPromise) => {
    const stream = fs.createReadStream(path);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', rejectPromise);
    stream.on('end', resolvePromise);
  });
  return hash.digest('hex');
}

async function main() {
  const uniqueFiles = new Set();
  for (const target of targets) {
    const files = await gatherFiles(target);
    files.forEach((file) => uniqueFiles.add(file));
  }

  const lines = [];
  for (const file of Array.from(uniqueFiles).sort()) {
    const digest = await hashFile(file);
    const rel = relative(repoRoot, file);
    lines.push(`${digest}  ${rel}`);
  }

  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, lines.join('\n') + '\n', 'utf8');
  console.info(`Checksums written to ${relative(repoRoot, outputFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
