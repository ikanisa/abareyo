import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRECTORIES = ['app', 'src', 'packages', 'supabase'];
const REPORT_ROOT = path.join(ROOT, 'reports', 'refactor');
const PREVIEW_DEPTH = 2;

const ROUTE_FILES = new Set([
  'page.tsx',
  'page.ts',
  'layout.tsx',
  'layout.ts',
  'loading.tsx',
  'loading.ts',
  'not-found.tsx',
  'not-found.ts',
  'error.tsx',
  'error.ts',
  'route.ts',
  'route.tsx',
]);

const SIGNAL_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.cjs',
  '.mjs',
  '.json',
  '.md',
  '.mdx',
  '.sql',
  '.prisma',
  '.yml',
  '.yaml',
  '.env',
]);

const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', '.expo']);

type ExtensionMap = Map<string, number>;

type DirectoryStats = {
  path: string;
  totalFiles: number;
  totalDirectories: number;
  extensionCounts: ExtensionMap;
};

type RouteRecord = {
  path: string;
  segmentType: 'static' | 'dynamic' | 'catchall';
  files: string[];
};

type PackageSnapshot = {
  location: string;
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
};

const normaliseSegments = (segment: string) => {
  if (segment.startsWith('(') && segment.endsWith(')')) {
    return null;
  }
  if (segment.startsWith('@')) {
    return null;
  }
  if (segment === '') {
    return null;
  }
  return segment;
};

const classifyRoute = (segments: string[]): RouteRecord['segmentType'] => {
  let type: RouteRecord['segmentType'] = 'static';
  for (const segment of segments) {
    if (segment.includes('[...') || segment.includes('[[...')) {
      return 'catchall';
    }
    if (segment.includes('[') && segment.includes(']')) {
      type = 'dynamic';
    }
  }
  return type;
};

const walkForStats = (dir: string): DirectoryStats => {
  const extensionCounts: ExtensionMap = new Map();
  let totalFiles = 0;
  let totalDirectories = 0;

  const stack: string[] = [dir];

  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        totalDirectories += 1;
        stack.push(entryPath);
      } else if (entry.isFile()) {
        totalFiles += 1;
        const extension = path.extname(entry.name) || '<none>';
        extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + 1);
      }
    }
  }

  return { path: dir, totalFiles, totalDirectories, extensionCounts };
};

const buildTreePreview = (dir: string, depth = 0): string[] => {
  if (depth > PREVIEW_DEPTH) {
    return [];
  }

  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !IGNORED_DIRECTORIES.has(entry.name))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) {
        return -1;
      }
      if (!a.isDirectory() && b.isDirectory()) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });

  const lines: string[] = [];
  for (const entry of entries) {
    const indent = '  '.repeat(depth);
    const suffix = entry.isDirectory() ? '/' : '';
    lines.push(`${indent}- ${entry.name}${suffix}`);
    if (entry.isDirectory() && depth < PREVIEW_DEPTH) {
      lines.push(...buildTreePreview(path.join(dir, entry.name), depth + 1));
    }
  }
  return lines;
};

const detectOrphans = (dir: string, relativeBase: string): { hasSignal: boolean; orphans: string[] } => {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !IGNORED_DIRECTORIES.has(entry.name));

  let hasSignal = false;
  const discoveredOrphans: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isFile()) {
      const extension = path.extname(entry.name);
      if (SIGNAL_EXTENSIONS.has(extension)) {
        hasSignal = true;
      }
    } else if (entry.isDirectory()) {
      const { hasSignal: childHasSignal, orphans } = detectOrphans(entryPath, relativeBase);
      if (orphans.length) {
        discoveredOrphans.push(...orphans);
      }
      if (childHasSignal) {
        hasSignal = true;
      }
    }
  }

  if (!hasSignal) {
    const relativePath = path.relative(relativeBase, dir).replace(/\\/g, '/');
    if (relativePath) {
      discoveredOrphans.push(relativePath);
    }
  }

  return { hasSignal, orphans: discoveredOrphans };
};

const gatherRoutes = (appDir: string): RouteRecord[] => {
  if (!fs.existsSync(appDir)) {
    return [];
  }

  const byPath = new Map<string, Set<string>>();
  const segmentTypeByPath = new Map<string, RouteRecord['segmentType']>();

  const recordRouteFile = (segments: string[], file: string) => {
    const routePath = `/${segments.map((segment) => segment.replace(/%5B/g, '[').replace(/%5D/g, ']')).join('/')}`.replace(/\\+/g, '/');
    const pathKey = routePath === '//' ? '/' : routePath;
    if (!byPath.has(pathKey)) {
      byPath.set(pathKey, new Set());
    }
    byPath.get(pathKey)?.add(file);
    if (!segmentTypeByPath.has(pathKey)) {
      segmentTypeByPath.set(pathKey, classifyRoute(segments));
    }
  };

  const walk = (dir: string, segments: string[]) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && ROUTE_FILES.has(entry.name)) {
        recordRouteFile(segments, entry.name);
      }
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const normalised = normaliseSegments(entry.name);
      const nextSegments = [...segments];
      if (normalised === null) {
        walk(path.join(dir, entry.name), nextSegments);
        continue;
      }
      nextSegments.push(entry.name);
      walk(path.join(dir, entry.name), nextSegments);
    }
  };

  const rootEntries = fs.readdirSync(appDir, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (entry.isFile() && ROUTE_FILES.has(entry.name)) {
      recordRouteFile([], entry.name);
    }
  }

  walk(appDir, []);

  return Array.from(byPath.entries())
    .map(([routePath, files]) => ({
      path: routePath,
      segmentType: segmentTypeByPath.get(routePath) ?? 'static',
      files: Array.from(files).sort(),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
};

const findPackageJsons = (dir: string): string[] => {
  const stack: string[] = [dir];
  const packageJsons: string[] = [];

  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile() && entry.name === 'package.json') {
        packageJsons.push(entryPath);
      }
    }
  }

  return packageJsons;
};

const loadPackageSnapshot = (packageJsonPath: string): PackageSnapshot | null => {
  try {
    const raw = fs.readFileSync(packageJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as {
      name?: string;
      version?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    };

    return {
      location: path.relative(ROOT, packageJsonPath).replace(/\\/g, '/'),
      name: parsed.name ?? '<unnamed>',
      version: parsed.version ?? '0.0.0',
      dependencies: parsed.dependencies ?? {},
      devDependencies: parsed.devDependencies ?? {},
      peerDependencies: parsed.peerDependencies ?? {},
      optionalDependencies: parsed.optionalDependencies ?? {},
    };
  } catch (error) {
    console.warn(`Unable to parse package.json at ${packageJsonPath}`, error);
    return null;
  }
};

const writeStructureReport = (statsByDirectory: DirectoryStats[], previewByDirectory: Map<string, string[]>) => {
  const lines: string[] = [];
  lines.push('# Refactor Structure Audit');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  for (const stats of statsByDirectory) {
    const relative = path.relative(ROOT, stats.path) || '.';
    lines.push(`## ${relative}`);
    lines.push('');
    lines.push(`- Total directories: ${stats.totalDirectories}`);
    lines.push(`- Total files: ${stats.totalFiles}`);
    if (stats.extensionCounts.size > 0) {
      lines.push('- File extensions:');
      const sortedExtensions = Array.from(stats.extensionCounts.entries()).sort((a, b) => b[1] - a[1]);
      for (const [extension, count] of sortedExtensions) {
        lines.push(`  - \`${extension}\`: ${count}`);
      }
    }
    const preview = previewByDirectory.get(stats.path) ?? [];
    if (preview.length) {
      lines.push('');
      lines.push('````');
      lines.push(`${relative}/`);
      for (const line of preview) {
        lines.push(line);
      }
      lines.push('````');
    }
    lines.push('');
  }

  fs.mkdirSync(REPORT_ROOT, { recursive: true });
  fs.writeFileSync(path.join(REPORT_ROOT, 'structure.md'), `${lines.join('\n').trim()}\n`);
};

const writeRoutesReport = (routes: RouteRecord[]) => {
  const payload = {
    generatedAt: new Date().toISOString(),
    totalRoutes: routes.length,
    routes,
  };
  fs.mkdirSync(REPORT_ROOT, { recursive: true });
  fs.writeFileSync(path.join(REPORT_ROOT, 'routes.json'), `${JSON.stringify(payload, null, 2)}\n`);
};

const writeOrphansReport = (orphansByDirectory: Map<string, string[]>) => {
  const payload: Record<string, string[]> = {};
  for (const [directory, orphans] of orphansByDirectory.entries()) {
    payload[path.relative(ROOT, directory).replace(/\\/g, '/')] = orphans.sort();
  }
  fs.mkdirSync(REPORT_ROOT, { recursive: true });
  fs.writeFileSync(path.join(REPORT_ROOT, 'orphans.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), directories: payload }, null, 2)}\n`);
};

const writeDependencyReport = (snapshots: PackageSnapshot[]) => {
  fs.mkdirSync(REPORT_ROOT, { recursive: true });
  fs.writeFileSync(
    path.join(REPORT_ROOT, 'deps.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), packages: snapshots }, null, 2)}\n`,
  );
};

const main = () => {
  const statsByDirectory: DirectoryStats[] = [];
  const previewByDirectory = new Map<string, string[]>();
  const orphanMap = new Map<string, string[]>();
  const packageSnapshots: PackageSnapshot[] = [];

  for (const directory of TARGET_DIRECTORIES) {
    const absolutePath = path.join(ROOT, directory);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`Skipping missing directory: ${directory}`);
      continue;
    }

    statsByDirectory.push(walkForStats(absolutePath));
    previewByDirectory.set(absolutePath, buildTreePreview(absolutePath));

    const { orphans } = detectOrphans(absolutePath, absolutePath);
    orphanMap.set(absolutePath, orphans);

    for (const packageJsonPath of findPackageJsons(absolutePath)) {
      const snapshot = loadPackageSnapshot(packageJsonPath);
      if (snapshot) {
        packageSnapshots.push(snapshot);
      }
    }
  }

  writeStructureReport(statsByDirectory, previewByDirectory);
  writeRoutesReport(gatherRoutes(path.join(ROOT, 'app')));
  writeOrphansReport(orphanMap);
  writeDependencyReport(packageSnapshots.sort((a, b) => a.location.localeCompare(b.location)));
};

main();
