import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const platform = process.argv[2];
if (!platform) {
  console.error('Usage: node scripts/native-tests/run.mjs <android|ios>');
  process.exit(1);
}

const root = process.cwd();

if (platform === 'android') {
  await verifyAndroid(root);
} else if (platform === 'ios') {
  await runSwiftTests(root);
} else {
  console.error(`Unknown platform: ${platform}`);
  process.exit(1);
}

async function verifyAndroid(basePath) {
  const gradlew = path.join(basePath, 'android', 'gradlew');
  const manifest = path.join(basePath, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  await access(gradlew, constants.X_OK);
  await access(manifest, constants.R_OK);
  console.log('Android native layout verified.');
}

async function runSwiftTests(basePath) {
  console.log('Running Swift package tests in ios/');
  await exec('swift', ['test', '--package-path', path.join(basePath, 'ios'), '--parallel']);
}

function exec(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}
