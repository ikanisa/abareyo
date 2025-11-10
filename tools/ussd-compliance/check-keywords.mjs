#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '../..');

const loadConfig = () => {
  const configPath = path.join(scriptDir, 'keywords.json');
  if (!existsSync(configPath)) {
    return { patterns: [], ignore: [] };
  }
  try {
    const raw = readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
      ignore: Array.isArray(parsed.ignore) ? parsed.ignore : [],
    };
  } catch (error) {
    console.error('[ussd-compliance] Failed to parse keywords.json', error);
    return { patterns: [], ignore: [] };
  }
};

const { patterns: patternConfig, ignore: ignoreConfig } = loadConfig();

const defaultRoots = ['app', 'src', 'packages/contracts'];
const cliRoots = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const activeRoots = cliRoots.length > 0 ? cliRoots : defaultRoots;

const toRegex = (value) => {
  if (!value) return null;
  if (value instanceof RegExp) return value;
  if (typeof value === 'string') {
    if (value.startsWith('/') && value.lastIndexOf('/') > 0) {
      const lastSlash = value.lastIndexOf('/');
      const body = value.slice(1, lastSlash);
      const flags = value.slice(lastSlash + 1) || undefined;
      return new RegExp(body, flags);
    }
    return new RegExp(value);
  }
  return null;
};

const bannedPatterns = patternConfig.map((item) => ({
  regex: new RegExp(item.pattern, item.flags ?? 'i'),
  message: item.message ?? `Matched disallowed keyword: ${item.pattern}`,
}));

const ignoreRegexes = ignoreConfig.map((item) => toRegex(item)).filter((regex) => regex);

const gitList = execSync('git ls-files', { cwd: projectRoot, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const watchedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml'];

const filesToCheck = gitList.filter((file) => {
  if (!watchedExtensions.some((ext) => file.endsWith(ext))) {
    return false;
  }
  if (!activeRoots.some((root) => file.startsWith(root))) {
    return false;
  }
  if (ignoreRegexes.some((regex) => regex.test(file))) {
    return false;
  }
  return true;
});

const violations = [];

for (const file of filesToCheck) {
  let content = '';
  try {
    content = readFileSync(path.join(projectRoot, file), 'utf8');
  } catch (error) {
    console.warn(`[ussd-compliance] unable to read ${file}`, error);
    continue;
  }
  for (const pattern of bannedPatterns) {
    if (pattern.regex.test(content)) {
      violations.push({ file, message: pattern.message, pattern: pattern.regex.toString() });
      break;
    }
  }
}

if (violations.length > 0) {
  console.error('\nUSSD compliance check failed. Remove the following keywords or document an exemption:');
  for (const violation of violations) {
    console.error(` - ${violation.file} :: ${violation.pattern} :: ${violation.message}`);
  }
  console.error('\nHint: update tools/ussd-compliance/keywords.json if you need to adjust the banned list.');
  process.exitCode = 1;
} else {
  console.log('USSD compliance guard passed.');
}
