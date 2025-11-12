#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const files = [
  'src/components/admin/AdminShell.tsx',
  'src/components/admin/AdminOfflineNotice.tsx',
  'src/views/AdminMatchOpsView.tsx',
];

const errors = [];

const isAllowedDescription = (value) => {
  if (value.startsWith('t(')) return true;
  if (value.includes('error instanceof')) return true;
  if (value === 'undefined' || value === 'undefined,') return true;
  if (value.startsWith('deniedMessages[')) return true;
  return false;
};

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const lines = content.split(/\r?\n/);
  let inToast = false;
  let braceDepth = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!inToast && line.includes('toast({')) {
      inToast = true;
      braceDepth = (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length;
      continue;
    }

    if (!inToast) {
      continue;
    }

    braceDepth += (line.match(/{/g) ?? []).length;
    braceDepth -= (line.match(/}/g) ?? []).length;

    const trimmed = line.trim();
    if (trimmed.startsWith('title:')) {
      const value = trimmed.slice('title:'.length).trim();
      if (!value.startsWith('t(')) {
        errors.push(`${file}:${index + 1} – toast title must use useAdminLocale.t`);
      }
    }

    if (trimmed.startsWith('description:')) {
      let value = trimmed.slice('description:'.length).trim();
      if (!value) {
        let lookahead = index + 1;
        while (lookahead < lines.length) {
          const candidate = lines[lookahead].trim();
          if (candidate) {
            value = candidate;
            break;
          }
          lookahead += 1;
        }
      }
      if (!isAllowedDescription(value)) {
        errors.push(`${file}:${index + 1} – toast description must use useAdminLocale.t or a dynamic error message`);
      }
    }

    if (braceDepth <= 0) {
      inToast = false;
    }
  }
}

if (errors.length) {
  console.error('admin-copy: detected untranslated toast copy');
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log('admin-copy: toast localization check passed');
