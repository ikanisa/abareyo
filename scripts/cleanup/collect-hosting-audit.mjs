import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { basename, dirname, resolve, relative } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..', '..');
const cleanupDir = resolve(repoRoot, 'reports', 'cleanup');

const hostPattern = '(vercel|render\\.com|onrender|@vercel/)';
const envKeyPattern = '[A-Z0-9_]*(?:VERCEL|RENDER)[A-Z0-9_]*';

function createEnvKeyRegex(flags = 'g') {
  return new RegExp(`\\b${envKeyPattern}\\b`, flags);
}

const envKeyTestRegex = createEnvKeyRegex('');

const defaultIgnores = new Set([
  '.git',
  '.next',
  'node_modules',
  '.turbo',
  'dist',
  'build',
  '.vercel',
]);

function ensureCleanupDir() {
  mkdirSync(cleanupDir, { recursive: true });
}

function parseRgMatches(stdout) {
  const matches = [];
  if (!stdout) {
    return matches;
  }

  for (const line of stdout.trim().split('\n')) {
    if (!line) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch (error) {
      console.warn('Skipping unparsable ripgrep line:', line, error);
      continue;
    }

    if (event.type !== 'match') {
      continue;
    }

    const filePath = event.data?.path?.text;
    const lineNumber = event.data?.line_number;
    const lineText = event.data?.lines?.text ?? '';
    const submatches = event.data?.submatches ?? [];

    if (!filePath || !lineNumber) {
      continue;
    }

    for (const submatch of submatches) {
      if (!submatch?.match?.text) continue;
      matches.push({
        file: relative(repoRoot, resolve(repoRoot, filePath)),
        line: lineNumber,
        column: typeof submatch.start === 'number' ? submatch.start + 1 : null,
        match: submatch.match.text,
        lineText: lineText.replace(/\r?\n$/, ''),
      });
    }
  }

  return matches;
}

function collectHostReferences() {
  const rgArgs = [
    '--json',
    '-i',
    '--hidden',
    '--line-number',
    '--column',
    '--glob',
    '!.git/**',
    '--glob',
    '!node_modules/**',
    '--glob',
    '!reports/cleanup/*.json',
    hostPattern,
    '.',
  ];

  const result = spawnSync('rg', rgArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  // Exit code 0 => matches, 1 => no matches, >1 => error.
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`ripgrep failed: ${result.stderr || result.error}`);
  }

  return parseRgMatches(result.stdout || '');
}

function walkFiles(startDir, onFile) {
  const entries = readdirSync(startDir, { withFileTypes: true });
  for (const entry of entries) {
    if (defaultIgnores.has(entry.name)) continue;
    const fullPath = resolve(startDir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, onFile);
    } else if (entry.isFile()) {
      onFile(fullPath);
    }
  }
}

function collectEnvKeyMatches() {
  const workflowFiles = new Set();
  const additionalTargets = new Set([
    resolve(repoRoot, 'config', 'validated-env.mjs'),
  ]);

  const candidateEnvFiles = new Set();

  walkFiles(repoRoot, (filePath) => {
    const relativePath = relative(repoRoot, filePath);
    if (relativePath.startsWith('reports/cleanup/')) {
      return;
    }

    if (relativePath.startsWith('.github/workflows/')) {
      workflowFiles.add(filePath);
      return;
    }

    const fileName = basename(filePath);
    if (fileName && fileName.startsWith('.env')) {
      candidateEnvFiles.add(filePath);
    }
  });

  const envResults = [];
  for (const filePath of candidateEnvFiles) {
    const content = readFileSync(filePath, 'utf8');
    const keys = [];
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [rawKey] = trimmed.split('=', 1);
      const key = rawKey?.trim();
      if (!key) continue;
      if (envKeyTestRegex.test(key)) {
        keys.push(key);
      }
    }
    if (keys.length > 0) {
      envResults.push({
        file: relative(repoRoot, filePath),
        keys: Array.from(new Set(keys)),
      });
    }
  }

  const configResults = [];
  for (const filePath of additionalTargets) {
    if (!existsSync(filePath)) continue;
    const stat = statSync(filePath);
    if (!stat.isFile()) continue;
    const content = readFileSync(filePath, 'utf8');
    const matches = extractEnvKeys(content);
    if (matches.length > 0) {
      configResults.push({
        file: relative(repoRoot, filePath),
        keys: Array.from(new Set(matches)),
      });
    }
  }

  const workflowResults = [];
  for (const filePath of workflowFiles) {
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, 'utf8');
    const matches = extractEnvKeys(content);
    if (matches.length > 0) {
      workflowResults.push({
        file: relative(repoRoot, filePath),
        keys: Array.from(new Set(matches)),
      });
    }
  }

  return {
    envFiles: envResults.sort((a, b) => a.file.localeCompare(b.file)),
    configFiles: configResults.sort((a, b) => a.file.localeCompare(b.file)),
    workflowFiles: workflowResults.sort((a, b) => a.file.localeCompare(b.file)),
  };
}

function extractEnvKeys(text) {
  const regex = createEnvKeyRegex('g');
  const matches = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.add(match[0]);
  }
  return Array.from(matches);
}

function isTargetPackage(name) {
  if (!name) return false;
  if (name.startsWith('@vercel/')) return true;
  const normalized = name.toLowerCase();
  if (normalized.startsWith('@render/')) return true;
  if (/^(?:@render\/|render(?:[-/]|$))/i.test(name)) return true;
  return false;
}

function collectPackages() {
  const packages = {
    packageJson: [],
    lockfiles: {},
  };

  const packageJsonPath = resolve(repoRoot, 'package.json');
  if (existsSync(packageJsonPath)) {
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const direct = new Set();
    for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      const deps = content?.[section];
      if (!deps) continue;
      for (const name of Object.keys(deps)) {
        if (isTargetPackage(name)) {
          direct.add(name);
        }
      }
    }
    packages.packageJson = Array.from(direct).sort();
  }

  const lockfileMatches = {};

  const packageLockPath = resolve(repoRoot, 'package-lock.json');
  if (existsSync(packageLockPath)) {
    try {
      const lockContent = JSON.parse(readFileSync(packageLockPath, 'utf8'));
      const matches = new Set();

      if (lockContent?.dependencies) {
        for (const name of Object.keys(lockContent.dependencies)) {
          if (isTargetPackage(name)) {
            matches.add(name);
          }
        }
      }

      if (lockContent?.packages) {
        for (const [pkgPath, pkgInfo] of Object.entries(lockContent.packages)) {
          const name = pkgInfo?.name ?? pkgPath;
          if (isTargetPackage(name)) {
            matches.add(name);
          }
        }
      }

      lockfileMatches['package-lock.json'] = Array.from(matches).sort();
    } catch (error) {
      lockfileMatches['package-lock.json'] = {
        error: `Failed to parse package-lock.json: ${error.message}`,
      };
    }
  }

  const bunLockPath = resolve(repoRoot, 'bun.lockb');
  if (existsSync(bunLockPath)) {
    lockfileMatches['bun.lockb'] = {
      parsed: false,
      reason: 'Binary Bun lockfile parsing not implemented',
    };
  }

  packages.lockfiles = lockfileMatches;
  return packages;
}

function collectWorkflowHostRefs() {
  const workflowsDir = resolve(repoRoot, '.github', 'workflows');
  if (!existsSync(workflowsDir)) {
    return [];
  }

  const results = [];
  const entries = readdirSync(workflowsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.yml') && !entry.name.endsWith('.yaml')) continue;
    const fullPath = resolve(workflowsDir, entry.name);
    const content = readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const matches = [];
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const match = line.match(/(vercel|render\\.com|onrender|@vercel\/)/i);
      if (match) {
        matches.push({
          line: index + 1,
          text: line.trim(),
          match: match[0],
        });
      }
    }
    if (matches.length > 0) {
      results.push({
        file: relative(repoRoot, fullPath),
        matches,
      });
    }
  }
  return results.sort((a, b) => a.file.localeCompare(b.file));
}

function collectCandidateFiles() {
  const candidates = [
    'vercel.json',
    'render.yaml',
    '.vercel',
    '.render',
  ];

  return candidates.map((candidate) => {
    const fullPath = resolve(repoRoot, candidate);
    return {
      path: candidate,
      exists: existsSync(fullPath),
      type: existsSync(fullPath)
        ? (statSync(fullPath).isDirectory() ? 'directory' : 'file')
        : null,
    };
  });
}

function main() {
  ensureCleanupDir();

  const hostRefs = collectHostReferences();
  const envRefs = collectEnvKeyMatches();
  const packageRefs = collectPackages();
  const workflowRefs = collectWorkflowHostRefs();
  const candidateFiles = collectCandidateFiles();

  writeJsonFile(resolve(cleanupDir, 'host_refs.json'), { matches: hostRefs });
  writeJsonFile(resolve(cleanupDir, 'env_refs.json'), envRefs);
  writeJsonFile(resolve(cleanupDir, 'packages.json'), packageRefs);
  writeJsonFile(resolve(cleanupDir, 'workflows.json'), { workflows: workflowRefs });
  writeJsonFile(resolve(cleanupDir, 'files.json'), { candidates: candidateFiles });
}

main();

function writeJsonFile(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}
