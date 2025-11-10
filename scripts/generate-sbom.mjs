#!/usr/bin/env node
import { mkdir, stat, copyFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(repoRoot, 'report/sbom');
const policyPath = resolve(repoRoot, 'config/compliance/license-policies.json');

const targets = [
  { name: 'web', cwd: repoRoot, output: resolve(outputDir, 'web-app.cdx.json') },
  { name: 'backend', cwd: resolve(repoRoot, 'backend'), output: resolve(outputDir, 'backend-service.cdx.json') },
];

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function run(command, args, options) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
}

async function ensurePolicyCopy() {
  if (!(await pathExists(policyPath))) {
    return;
  }
  const destination = resolve(outputDir, 'license-policy.json');
  await copyFile(policyPath, destination);
}

async function generateSbom(target) {
  const packageJsonPath = resolve(target.cwd, 'package.json');
  if (!(await pathExists(packageJsonPath))) {
    console.warn(`Skipping SBOM for ${target.name}: no package.json at ${relative(repoRoot, packageJsonPath)}`);
    return null;
  }

  const args = [
    '--yes',
    '@cyclonedx/cyclonedx-npm',
    '--output-format',
    'json',
    '--spec-version',
    '1.5',
    '--output-file',
    target.output,
    '--ignore-npm-errors',
  ];

  console.info(`Generating SBOM for ${target.name} (${relative(repoRoot, target.cwd) || '.'})`);
  await run(npxCmd, args, { cwd: target.cwd });
  return target;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const generated = [];
  for (const target of targets) {
    const result = await generateSbom(target);
    if (result) {
      generated.push({
        name: result.name,
        path: relative(repoRoot, result.output),
      });
    }
  }

  await ensurePolicyCopy();

  const manifest = {
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? null,
    artifacts: generated,
  };

  await writeFile(resolve(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.info(`SBOM manifest written to ${relative(repoRoot, resolve(outputDir, 'manifest.json'))}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
