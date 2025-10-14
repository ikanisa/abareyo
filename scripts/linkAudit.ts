import fs from 'node:fs';
import path from 'node:path';
import type { Node } from 'typescript';
import ts from 'typescript';

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');
const SEARCH_DIRS = ['app', 'components', 'src'];
const EXTS = new Set(['.tsx', '.ts', '.jsx', '.js']);

const isInternal = (href: string) => href.startsWith('/') && !href.startsWith('//');

type LinkRecord = {
  source: string;
  line: number;
  column: number;
  type: 'next/link' | 'anchor' | 'router.push' | 'router.replace' | 'router.prefetch';
  target: string;
  notes?: string;
  internal: boolean;
};

const walkFiles = (dir: string): string[] => {
  const absolute = path.join(ROOT, dir);
  if (!fs.existsSync(absolute)) {
    return [];
  }
  const results: string[] = [];
  const stack = [absolute];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    const stats = fs.statSync(current);
    if (stats.isDirectory()) {
      const entries = fs.readdirSync(current);
      for (const entry of entries) {
        if (entry.startsWith('.')) continue;
        if (entry === 'node_modules' || entry === '.next') continue;
        stack.push(path.join(current, entry));
      }
      continue;
    }
    const ext = path.extname(current);
    if (!EXTS.has(ext)) continue;
    results.push(current);
  }
  return results;
};

const collectImports = (sourceFile: ts.SourceFile) => {
  const linkNames = new Set<string>();
  const useRouterNames = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
    const moduleSpecifier = (statement.moduleSpecifier as ts.StringLiteral).text;
    if (moduleSpecifier === 'next/link') {
      const { importClause } = statement;
      if (importClause.name) {
        linkNames.add(importClause.name.text);
      }
      if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) {
          linkNames.add(element.name.text);
        }
      }
    }
    if (moduleSpecifier === 'next/navigation') {
      const { importClause } = statement;
      if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) {
          const localName = element.name.text;
          const importedName = element.propertyName?.text ?? element.name.text;
          if (importedName === 'useRouter') {
            useRouterNames.add(localName);
          }
        }
      }
    }
  }

  return { linkNames, useRouterNames };
};

const collectRouterVariables = (sourceFile: ts.SourceFile, useRouterNames: Set<string>) => {
  const routerVars = new Set<string>();

  const visit = (node: Node) => {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
      const call = node.initializer;
      if (ts.isIdentifier(call.expression) && useRouterNames.has(call.expression.text) && ts.isIdentifier(node.name)) {
        routerVars.add(node.name.text);
      }
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
  return routerVars;
};

const extractStringLiteral = (node: ts.Expression | undefined): string | null => {
  if (!node) return null;
  if (ts.isStringLiteralLike(node)) {
    return node.text.trim();
  }
  return null;
};

const collectLinksFromFile = (filePath: string): LinkRecord[] => {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const { linkNames, useRouterNames } = collectImports(sourceFile);
  const routerVars = collectRouterVariables(sourceFile, useRouterNames);
  const records: LinkRecord[] = [];

  const visit = (node: Node) => {
    if (ts.isJsxOpeningLikeElement(node)) {
      const tag = node.tagName;
      const tagName = ts.isIdentifier(tag) ? tag.text : undefined;
      const isLinkTag = tagName && linkNames.has(tagName);
      const isAnchor = tagName === 'a';
      if (isLinkTag || isAnchor) {
        for (const attr of node.attributes.properties) {
          if (ts.isJsxAttribute(attr) && attr.name.text === 'href' && attr.initializer) {
            const hrefValue = ts.isStringLiteral(attr.initializer)
              ? attr.initializer.text
              : ts.isJsxExpression(attr.initializer)
                ? extractStringLiteral(attr.initializer.expression ?? undefined)
                : null;
            if (hrefValue) {
              const { line, character } = sourceFile.getLineAndCharacterOfPosition(attr.getStart());
              records.push({
                source: path.relative(ROOT, filePath),
                line: line + 1,
                column: character + 1,
                type: isLinkTag ? 'next/link' : 'anchor',
                target: hrefValue,
                internal: isInternal(hrefValue),
                notes: isInternal(hrefValue) ? undefined : 'external',
              });
            }
          }
        }
      }
    }

    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const property = node.expression;
      if (ts.isIdentifier(property.expression) && routerVars.has(property.expression.text)) {
        const operation = property.name.text;
        if (operation === 'push' || operation === 'replace' || operation === 'prefetch') {
          const firstArg = extractStringLiteral(node.arguments[0]);
          if (firstArg) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            records.push({
              source: path.relative(ROOT, filePath),
              line: line + 1,
              column: character + 1,
              type: operation === 'push' ? 'router.push' : operation === 'replace' ? 'router.replace' : 'router.prefetch',
              target: firstArg,
              internal: isInternal(firstArg),
              notes: operation === 'prefetch' ? 'prefetch' : undefined,
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
  return records;
};

const allFiles = SEARCH_DIRS.flatMap((dir) => walkFiles(dir));
const linkRecords = allFiles.flatMap((file) => collectLinksFromFile(file));
const uniqueInternalTargets = Array.from(new Set(linkRecords.filter((record) => record.internal).map((record) => record.target))).sort();

fs.mkdirSync(REPORTS_DIR, { recursive: true });

const report = {
  generatedAt: new Date().toISOString(),
  scannedFiles: allFiles.length,
  links: linkRecords,
  summary: {
    totalLinks: linkRecords.length,
    internalLinks: linkRecords.filter((record) => record.internal).length,
    externalLinks: linkRecords.filter((record) => !record.internal).length,
    uniqueInternalTargets,
  },
};

fs.writeFileSync(path.join(REPORTS_DIR, 'link-audit.json'), JSON.stringify(report, null, 2));

const markdownLines = [
  '# Link Audit',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `Files scanned: ${report.scannedFiles}`,
  '',
  '| Source | Line | Type | Target | Notes |',
  '| --- | --- | --- | --- | --- |',
];

for (const record of linkRecords.sort((a, b) => a.source.localeCompare(b.source) || a.line - b.line)) {
  markdownLines.push(
    `| \`${record.source}\` | ${record.line} | ${record.type} | ${record.target} | ${record.notes ?? ''} |`,
  );
}

fs.writeFileSync(path.join(REPORTS_DIR, 'link-audit.md'), `${markdownLines.join('\n')}\n`);

console.log(`Link audit complete. ${linkRecords.length} links captured.`);
