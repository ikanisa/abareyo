#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(repoRoot, 'report/sbom');
const policyPath = resolve(repoRoot, 'config/compliance/license-policies.json');
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const targets = [
  { name: 'web', cwd: repoRoot },
  { name: 'backend', cwd: resolve(repoRoot, 'backend') },
  { name: 'mobile', cwd: resolve(repoRoot, 'packages/mobile') },
];

async function runLicenseChecker(target) {
  return await new Promise((resolvePromise, rejectPromise) => {
    const args = ['--yes', 'license-checker-rseidelsohn', '--json', '--production'];
    const child = spawn(npxCmd, args, { cwd: target.cwd, stdio: ['ignore', 'pipe', 'inherit'] });
    const chunks = [];
    child.stdout.on('data', (chunk) => chunks.push(chunk));
    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code !== 0) {
        rejectPromise(new Error(`license-checker exited with code ${code} (${target.name})`));
        return;
      }
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolvePromise(data);
      } catch (error) {
        rejectPromise(error);
      }
    });
  });
}

function normaliseLicenses(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normaliseLicenses(entry));
  }
  if (typeof value !== 'string') {
    return [];
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }
  const canonical = trimmed.toUpperCase();
  const hyphenated = canonical.replace(/\s+/g, '-');
  const conjunctionSplit = hyphenated
    .replace(/-AND-|-OR-|-WITH-|-WITHOUT-|-PLUS-|-ON-|-IN-|-FILE-|-LICENSE-|-VERSION-/g, '|')
    .split('|');
  const rawTokens = hyphenated.split(/[^A-Z0-9.\-]+/u).concat(conjunctionSplit);
  const blacklist = new Set(['AND', 'OR', 'WITH', 'WITHOUT', 'ON', 'IN', 'FILE', 'LICENSE', 'VERSION', 'THE']);
  const tokens = rawTokens
    .map((token) => token.replace(/^[^A-Z0-9]+|[^A-Z0-9]+$/g, '').trim())
    .filter((token) => token && !blacklist.has(token));
  const set = new Set(tokens);
  set.add(hyphenated);
  return Array.from(set);
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const policies = JSON.parse(await readFile(policyPath, 'utf8'));
  const allow = new Set((policies.allow ?? []).map((license) => license.toUpperCase()));
  const deny = new Set((policies.deny ?? []).map((license) => license.toUpperCase()));
  const exceptions = policies.exceptions ?? {};

  const report = { generatedAt: new Date().toISOString(), results: [], policyVersion: policies.policyVersion ?? null };
  const violations = [];

  for (const target of targets) {
    const data = await runLicenseChecker(target);
    const entries = Object.entries(data).map(([pkg, meta]) => ({
      id: pkg,
      licenses: normaliseLicenses(meta.licenses),
      licenseExpression: meta.licenses ?? 'UNKNOWN',
      repository: meta.repository ?? null,
      path: meta.path ? relative(repoRoot, meta.path) : null,
    }));

    const targetViolations = [];
    for (const entry of entries) {
      const exception = exceptions[entry.id];
      if (exception) {
        continue;
      }
      const denied = entry.licenses.some((license) => deny.has(license));
      const isAllowed = entry.licenses.some((license) => allow.has(license));
      if (denied && !isAllowed) {
        targetViolations.push({ id: entry.id, reason: `License "${entry.licenseExpression}" is denied.` });
        continue;
      }
      if (!isAllowed) {
        targetViolations.push({ id: entry.id, reason: `License "${entry.licenseExpression}" is not in allow list.` });
      }
    }

    report.results.push({
      target: target.name,
      dependencyCount: entries.length,
      violations: targetViolations,
    });

    violations.push(...targetViolations.map((violation) => ({ target: target.name, ...violation })));
  }

  await writeFile(resolve(outputDir, 'license-scan.json'), JSON.stringify(report, null, 2));

  if (violations.length > 0) {
    console.error('License policy violations detected:');
    for (const violation of violations) {
      console.error(` - [${violation.target}] ${violation.id}: ${violation.reason}`);
    }
    process.exitCode = 1;
    return;
  }

  console.info('All dependencies comply with license policy.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
