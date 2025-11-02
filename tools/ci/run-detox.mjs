#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const [, , platformArg] = process.argv;
const platform = (platformArg ?? 'android').toLowerCase();
const configuration = platform === 'ios' ? 'ios.sim.release' : 'android.emu.release';

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
      env: { ...process.env },
      shell: process.platform === 'win32',
      ...options,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });

const headless = process.env.DETOX_HEADLESS === '0' ? false : Boolean(process.env.CI ?? true);

async function main() {
  console.log(`\n[detox] Running build for configuration ${configuration}`);
  if (process.env.DETOX_SKIP_BUILD !== '1') {
    await run('npx', ['detox', 'build', '--configuration', configuration]);
  } else {
    console.log('[detox] Skipping build step because DETOX_SKIP_BUILD=1');
  }

  const testArgs = ['detox', 'test', '--configuration', configuration, '--cleanup'];
  if (headless) {
    testArgs.push('--headless');
  }

  if (platform === 'android' && process.env.ANDROID_AVD) {
    console.log(`[detox] Targeting Android AVD ${process.env.ANDROID_AVD}`);
  }
  if (platform === 'ios' && process.env.IOS_SIM_DEVICE) {
    console.log(`[detox] Targeting iOS simulator ${process.env.IOS_SIM_DEVICE}`);
  }

  await run('npx', testArgs);
}

main().catch((error) => {
  console.error('\n[detox] E2E run failed');
  console.error(error);
  process.exitCode = 1;
});
