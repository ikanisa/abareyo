import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const bannedPatterns = [
  /stripe/i,
  /paypal/i,
  /flutterwave/i,
  /mpesa/i,
  /visa_sdk/i,
  /mastercard/i,
  /paystack/i,
  /pesapal/i,
];

const whitelist = [
  /scripts\/ci\/assert-ussd-only\.ts$/,
  /package-lock\.json$/,
  /pnpm-lock\.ya?ml$/,
  /yarn\.lock$/,
  /bun\.lockb$/,
];

const files = execSync('git ls-files', { encoding: 'utf-8' })
  .split('\n')
  .filter(Boolean)
  .filter((file) => !/\.lock$/.test(file));

const offenders: Array<{ file: string; pattern: RegExp }> = [];

for (const file of files) {
  if (whitelist.some((regex) => regex.test(file))) {
    continue;
  }
  let content = '';
  try {
    content = readFileSync(file, 'utf-8');
  } catch (error) {
    console.warn(`Unable to read ${file}`, error);
    continue;
  }
  for (const pattern of bannedPatterns) {
    if (pattern.test(content)) {
      offenders.push({ file, pattern });
      break;
    }
  }
}

if (offenders.length) {
  console.error('Detected disallowed payment SDK references:');
  for (const offender of offenders) {
    console.error(` - ${offender.file} matched ${offender.pattern}`);
  }
  process.exitCode = 1;
} else {
  console.log('USSD-only guard passed.');
}
