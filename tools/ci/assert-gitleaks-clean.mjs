#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const REPORT_PATH = resolve('reports/sbom/gitleaks.sarif');

async function loadReport() {
  try {
    const raw = await readFile(REPORT_PATH, 'utf8');
    if (!raw.trim()) {
      return [];
    }
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (Array.isArray(parsed?.leaks)) {
      return parsed.leaks;
    }

    if (Array.isArray(parsed?.findings)) {
      return parsed.findings;
    }

    if (Array.isArray(parsed?.runs)) {
      const sarifFindings = [];
      for (const run of parsed.runs) {
        if (Array.isArray(run?.results)) {
          sarifFindings.push(...run.results);
        }
      }
      return sarifFindings;
    }

    return [];
  } catch (error) {
    console.error(`Failed to read gitleaks report at ${REPORT_PATH}`);
    throw error;
  }
}

(async () => {
  const leaks = await loadReport();
  if (leaks.length > 0) {
    console.error(`gitleaks detected ${leaks.length} potential secret exposure(s).`);
    const sample = leaks.slice(0, 5).map((entry) => entry?.Description || entry?.description || '');
    if (sample.length) {
      console.error('Sample findings:', sample.filter(Boolean));
    }
    process.exit(1);
  }
  console.log('gitleaks report clean: no findings detected.');
})();
