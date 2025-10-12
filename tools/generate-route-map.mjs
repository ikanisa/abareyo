import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = process.cwd();

function normalizeSegment(seg) {
  if (!seg) return null;
  if (seg.startsWith('(') && seg.endsWith(')')) {
    return null;
  }
  if (seg === 'page.tsx' || seg === 'page.ts') return null;
  if (seg === 'route.ts' || seg === 'route.tsx') return null;
  if (seg === 'layout.tsx' || seg === 'layout.ts') return null;
  if (seg === 'loading.tsx' || seg === 'loading.ts') return null;
  if (seg === 'default.tsx' || seg === 'default.ts') return null;
  if (seg === 'template.tsx' || seg === 'template.ts') return null;
  if (seg === 'error.tsx' || seg === 'error.ts') return null;
  if (seg === 'not-found.tsx' || seg === 'not-found.ts') return null;
  if (seg === 'route.js' || seg === 'route.jsx') return null;
  if (seg === 'page.js' || seg === 'page.jsx') return null;
  if (seg === 'layout.js' || seg === 'layout.jsx') return null;
  if (seg === 'loading.js' || seg === 'loading.jsx') return null;
  return seg;
}

function formatRoute(segments) {
  const formatted = segments
    .map((seg) => {
      if (seg.startsWith('[') && seg.endsWith(']')) {
        return seg;
      }
      return seg;
    })
    .filter(Boolean)
    .join('/');
  return `/${formatted}`.replace(/\/+/, '/').replace(/\/$/, '') || '/';
}

function collectAppRoutes(baseDir) {
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
      } else if (entry.isFile()) {
        if (/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) {
          const routeSegments = segments.map((seg) => normalizeSegment(seg)).filter(Boolean);
          const route = formatRoute(routeSegments);
          routes.push({ type: 'page', path: route, file: relative(repoRoot, fullPath) });
        }
        if (/^route\.(tsx|ts|jsx|js)$/.test(entry.name)) {
          const routeSegments = segments.map((seg) => normalizeSegment(seg)).filter(Boolean);
          const route = formatRoute(routeSegments);
          const kind = route.startsWith('/api') ? 'api' : 'route-handler';
          routes.push({ type: kind, path: route, file: relative(repoRoot, fullPath) });
        }
      }
    }
  }
  walk(baseDir, []);
  return routes;
}

function collectPagesRoutes(baseDir) {
  const routes = [];
  function walk(currentDir, segments = []) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('_')) continue;
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, [...segments, entry.name]);
      } else if (entry.isFile()) {
        if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
          const baseName = entry.name.replace(/\.(tsx|ts|jsx|js)$/, '');
          if (baseName === 'index') {
            const route = formatRoute(segments);
            routes.push({ type: 'page', path: route, file: relative(repoRoot, fullPath) });
          } else if (baseName.startsWith('api/')) {
            const route = formatRoute(['api', ...segments]);
            routes.push({ type: 'api', path: route, file: relative(repoRoot, fullPath) });
          } else {
            const route = formatRoute([...segments, baseName]);
            routes.push({ type: 'page', path: route, file: relative(repoRoot, fullPath) });
          }
        }
      }
    }
  }
  walk(baseDir, []);
  return routes;
}

function main() {
  const result = {
    generatedAt: new Date().toISOString(),
    routes: [],
  };

  const appDir = join(repoRoot, 'app');
  try {
    statSync(appDir);
    result.routes.push(...collectAppRoutes(appDir));
  } catch (error) {
    // ignore
  }

  const pagesDir = join(repoRoot, 'pages');
  try {
    statSync(pagesDir);
    result.routes.push(...collectPagesRoutes(pagesDir));
  } catch (error) {
    // ignore
  }

  result.routes.sort((a, b) => a.path.localeCompare(b.path));

  writeFileSync(join(repoRoot, 'reports', 'route_map.json'), JSON.stringify(result, null, 2));
}

main();
