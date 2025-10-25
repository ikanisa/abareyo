#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
process.chdir(rootDir);

const steps = [
  {
    label: 'Validate frontend environment',
    command: 'node scripts/check-frontend-env.mjs',
    errorMessage: 'Frontend environment validation failed',
  },
  {
    label: 'Verify backend endpoint',
    command: 'node scripts/check-backend-endpoint.mjs',
    errorMessage: 'Backend endpoint verification failed',
  },
  {
    label: 'Build Next.js application',
    command: 'npm run build',
    errorMessage: 'Next.js build failed',
  },
];

const run = (command) => {
  execSync(command, {
    stdio: 'inherit',
    shell: true,
  });
};

for (const step of steps) {
  console.log(`\n[preflight] ${step.label}`);
  try {
    run(step.command);
  } catch (error) {
    console.error(`\n[preflight] ${step.errorMessage}`);
    process.exit(1);
  }
}

console.log('\n[preflight] All checks passed');
