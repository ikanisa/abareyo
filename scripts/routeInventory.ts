import fs from 'node:fs';
import path from 'node:path';

const APP_DIR = path.join(process.cwd(), 'app');
const REPORTS_DIR = path.join(process.cwd(), 'reports');
const ROUTES_DIR = path.join(process.cwd(), 'routes');

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

type SegmentType = 'static' | 'dynamic' | 'catchall';

type RouteRecord = {
  path: string;
  segmentType: SegmentType;
  files: string[];
  hasNotFound: boolean;
  hasError: boolean;
  hasLoading: boolean;
};

const byPath = new Map<string, Set<string>>();
const segmentTypeByPath = new Map<string, SegmentType>();

const ignoredDirectories = new Set(['_components', '_config', '_data', '_hooks', '_lib', 'node_modules']);

const normaliseSegment = (segment: string) => {
  if (segment.startsWith('(') && segment.endsWith(')')) {
    return null;
  }
  if (segment.startsWith('@')) {
    return null;
  }
  if (segment === '') {
    return null;
  }
  if (ignoredDirectories.has(segment)) {
    return null;
  }
  return segment;
};

const classifySegments = (segments: string[]): SegmentType => {
  let type: SegmentType = 'static';
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

const recordRouteFile = (segments: string[], file: string) => {
  const routePath = `/${segments.map((segment) => segment.replace(/%5B/g, '[').replace(/%5D/g, ']')).join('/')}`.replace(/\/+/g, '/');
  const pathKey = routePath === '//' ? '/' : routePath;
  if (!byPath.has(pathKey)) {
    byPath.set(pathKey, new Set());
  }
  byPath.get(pathKey)?.add(file);
  if (!segmentTypeByPath.has(pathKey)) {
    segmentTypeByPath.set(pathKey, classifySegments(segments));
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

    const nextSegments = [...segments];
    const normalised = normaliseSegment(entry.name);
    if (normalised === null) {
      walk(path.join(dir, entry.name), nextSegments);
      continue;
    }

    nextSegments.push(entry.name);
    walk(path.join(dir, entry.name), nextSegments);
  }
};

if (!fs.existsSync(APP_DIR)) {
  console.error('No app directory found – aborting route inventory');
  process.exit(1);
}

// Root-level files (e.g. app/page.tsx)
const rootEntries = fs.readdirSync(APP_DIR, { withFileTypes: true });
for (const entry of rootEntries) {
  if (entry.isFile() && ROUTE_FILES.has(entry.name)) {
    recordRouteFile([], entry.name);
  }
}

walk(APP_DIR, []);

const routeRecords: RouteRecord[] = Array.from(byPath.entries())
  .map(([routePath, files]) => {
    const segmentType = segmentTypeByPath.get(routePath) ?? 'static';
    return {
      path: routePath,
      segmentType,
      files: Array.from(files).sort(),
      hasNotFound: files.has('not-found.tsx') || files.has('not-found.ts'),
      hasError: files.has('error.tsx') || files.has('error.ts'),
      hasLoading: files.has('loading.tsx') || files.has('loading.ts'),
    } satisfies RouteRecord;
  })
  .sort((a, b) => a.path.localeCompare(b.path));

const staticRoutes = routeRecords.filter((record) => record.segmentType === 'static').map((record) => record.path || '/');
const dynamicRoutes = routeRecords.filter((record) => record.segmentType !== 'static').map((record) => ({ pattern: record.path }));

fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.mkdirSync(ROUTES_DIR, { recursive: true });

const jsonReportPath = path.join(REPORTS_DIR, 'routes-inventory.json');
const markdownReportPath = path.join(REPORTS_DIR, 'routes-inventory.md');
const staticMapPath = path.join(ROUTES_DIR, 'sitemap.static.json');
const dynamicMapPath = path.join(ROUTES_DIR, 'sitemap.dynamic.template.json');

const summary = {
  generatedAt: new Date().toISOString(),
  totalRoutes: routeRecords.length,
  staticCount: staticRoutes.length,
  dynamicCount: dynamicRoutes.length,
};

const markdownLines = [
  '# Route Inventory',
  '',
  `Generated: ${summary.generatedAt}`,
  '',
  `Total routes: ${summary.totalRoutes} (static: ${summary.staticCount}, dynamic: ${summary.dynamicCount})`,
  '',
  '| Path | Type | Files | not-found | error | loading |',
  '| --- | --- | --- | --- | --- | --- |',
];

for (const record of routeRecords) {
  markdownLines.push(
    `| \`${record.path}\` | ${record.segmentType} | ${record.files.join(', ')} | ${record.hasNotFound ? '✅' : '⚠️'} | ${
      record.hasError ? '✅' : '⚠️'
    } | ${record.hasLoading ? '✅' : '⚠️'} |`,
  );
}

fs.writeFileSync(jsonReportPath, JSON.stringify({ summary, routes: routeRecords }, null, 2));
fs.writeFileSync(markdownReportPath, `${markdownLines.join('\n')}\n`);
fs.writeFileSync(staticMapPath, JSON.stringify({ generatedAt: summary.generatedAt, routes: staticRoutes }, null, 2));
fs.writeFileSync(dynamicMapPath, JSON.stringify({ generatedAt: summary.generatedAt, routes: dynamicRoutes }, null, 2));

console.log(`Route inventory written to ${jsonReportPath}`);
