#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key.startsWith('--')) {
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${key}`);
    }
    result[key.slice(2)] = value;
    index += 1;
  }
  return result;
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
  const options = parseArgs();
  const required = ['artifact', 'binary', 'output'];
  for (const key of required) {
    if (!options[key]) {
      throw new Error(`--${key} is required`);
    }
  }

  const outputPath = resolve(repoRoot, options.output);
  const binaryPath = resolve(repoRoot, options.binary);
  const sbomPath = options.sbom ? resolve(repoRoot, options.sbom) : undefined;
  const checksumPath = options.checksums ? resolve(repoRoot, options.checksums) : undefined;

  const payload = {
    artifact: options.artifact,
    binary: relative(repoRoot, binaryPath),
    binarySha256: await hashFile(binaryPath),
    sbom: sbomPath ? relative(repoRoot, sbomPath) : null,
    sbomSha256: sbomPath ? await hashFile(sbomPath) : null,
    checksums: checksumPath ? relative(repoRoot, checksumPath) : null,
    repository: process.env.GITHUB_REPOSITORY ?? null,
    commit: process.env.GITHUB_SHA ?? null,
    ref: process.env.GITHUB_REF ?? null,
    workflow: process.env.GITHUB_WORKFLOW ?? null,
    runId: process.env.GITHUB_RUN_ID ?? null,
    generatedAt: new Date().toISOString(),
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2));
  console.info(`Provenance written to ${relative(repoRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
