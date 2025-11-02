import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = process.cwd();

const ROUTE_FILE_PATTERN = /^(page|route)\.(tsx|ts|jsx|js)$/;
const IGNORED_FILES = new Set([
  'layout.tsx',
  'layout.ts',
  'template.tsx',
  'template.ts',
  'default.tsx',
  'default.ts',
  'loading.tsx',
  'loading.ts',
  'not-found.tsx',
  'not-found.ts',
  'error.tsx',
  'error.ts',
]);

const LOCALE_PREFIX_RE = /^\/(en|fr|rw)(?=\/|$)/;

function normalizeSegment(segment) {
  if (!segment) return null;
  if (segment.startsWith('(') && segment.endsWith(')')) return null;
  if (segment.startsWith('@')) return null;
  if (segment.startsWith('_')) return null;
  return segment;
}

function formatRoute(segments) {
  const filtered = segments.filter(Boolean);
  const path = `/${filtered.join('/')}`.replace(/\/+/g, '/');
  return path === '' ? '/' : path;
}

function collectRoutes(baseDir) {
  const routes = [];

  function walk(currentDir, segments = []) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('_')) continue;
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        const nextSegments = normalizeSegment(entry.name)
          ? [...segments, entry.name]
          : segments;
        walk(fullPath, nextSegments);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!ROUTE_FILE_PATTERN.test(entry.name)) continue;
      if (IGNORED_FILES.has(entry.name)) continue;

      const type = entry.name.startsWith('route')
        ? formatRoute(segments).startsWith('/api')
          ? 'api'
          : 'route-handler'
        : 'page';

      const normalizedSegments = segments
        .map((segment) => normalizeSegment(segment))
        .filter(Boolean);
      const path = formatRoute(normalizedSegments);

      routes.push({
        type,
        path,
        file: relative(repoRoot, join(currentDir, entry.name)),
      });
    }
  }

  try {
    statSync(baseDir);
    walk(baseDir, []);
  } catch (error) {
    // ignore missing directories
  }

  return routes;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function patternToRegex(pattern) {
  if (pattern === '/' || pattern === '') {
    return /^\/$/;
  }

  const segments = pattern.split('/').filter(Boolean);
  const translated = segments.map((segment) => {
    if (/^\[\[\.\.\.(.+)\]\]$/.test(segment)) {
      return '(?:[^/]+(?:/[^/]+)*)?';
    }
    if (/^\[\.\.\.(.+)\]$/.test(segment)) {
      return '(?:[^/]+(?:/[^/]+)*)';
    }
    if (/^\[(.+)\]$/.test(segment)) {
      return '[^/]+';
    }
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  const expression = `^/${translated.join('/')}$`;
  return new RegExp(expression);
}

function stripLocalePrefix(path) {
  return path.replace(LOCALE_PREFIX_RE, '') || '/';
}

function buildRouteReports() {
  const appRoutes = collectRoutes(join(repoRoot, 'app'));
  const pagesRoutes = collectRoutes(join(repoRoot, 'pages'));
  const allRoutes = [...appRoutes, ...pagesRoutes];
  allRoutes.sort((a, b) => a.path.localeCompare(b.path));

  const counts = allRoutes.reduce(
    (acc, route) => {
      acc.total += 1;
      acc.byType[route.type] = (acc.byType[route.type] ?? 0) + 1;
      return acc;
    },
    { total: 0, byType: {} },
  );

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      totalRoutes: counts.total,
      pages: counts.byType.page ?? 0,
      apis: (counts.byType.api ?? 0) + (counts.byType['route-handler'] ?? 0),
      routeHandlers: counts.byType['route-handler'] ?? 0,
    },
    routes: allRoutes,
  };

  const refactorDir = join(repoRoot, 'reports', 'refactor');
  mkdirSync(refactorDir, { recursive: true });
  writeFileSync(join(refactorDir, 'routes.json'), JSON.stringify(report, null, 2));

  const sitemapStaticPath = join(repoRoot, 'routes', 'sitemap.static.json');
  const sitemapDynamicPath = join(repoRoot, 'routes', 'sitemap.dynamic.template.json');

  const staticRoutes = new Set(loadJson(sitemapStaticPath).routes.map(stripLocalePrefix));
  const dynamicPatterns = loadJson(sitemapDynamicPath).routes
    .map((entry) => entry.pattern)
    .filter((pattern) => typeof pattern === 'string')
    .map(patternToRegex);

  const orphans = allRoutes.filter((route) => {
    if (staticRoutes.has(route.path)) {
      return false;
    }
    return !dynamicPatterns.some((regex) => regex.test(route.path));
  });

  const orphanReport = {
    generatedAt: report.generatedAt,
    summary: {
      totalRoutes: counts.total,
      covered: counts.total - orphans.length,
      uncovered: orphans.length,
    },
    orphans,
  };

  writeFileSync(join(repoRoot, 'routes', 'orphans.json'), JSON.stringify(orphanReport, null, 2));
}

buildRouteReports();
