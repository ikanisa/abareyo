import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { AdminTranslation, PaginatedResponse } from '@/lib/api/admin/translations';
import { fetchAdminTranslationLanguages, fetchAdminTranslations } from '@/lib/api/admin/translations';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

async function fetchWithSession<T>(path: string, deniedKey: string) {
  const cookieHeader = cookies().toString();
  const response = await fetch(`${BACKEND_BASE.replace(/\/$/, '')}${path}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (response.status === 401 || response.status === 403) {
    redirect(`/admin?denied=${deniedKey}`);
  }
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return (await response.json()) as T;
}

export default async function AdminTranslationsPage() {
  const [{ data: languages }, translations] = await Promise.all([
    fetchWithSession<{ data: string[] }>(`/admin/translations/languages`, 'translations'),
    fetchWithSession<PaginatedResponse<AdminTranslation>>(`/admin/translations?lang=en&page=1&pageSize=50`, 'translations'),
  ]);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-slate-100">Translations</h1>
      <p className="text-sm text-slate-400">Simple list of translations (read-only placeholder).</p>
      <div className="text-xs text-slate-400">Languages: {languages.join(', ') || '—'}</div>
      <div className="rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-white/5 text-slate-300">
              <th className="px-3 py-2">Lang</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Value</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {translations.data.map((t) => (
              <tr key={`${t.lang}:${t.key}`} className="border-t border-white/10">
                <td className="px-3 py-2 text-slate-200">{t.lang}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-300">{t.key}</td>
                <td className="px-3 py-2 text-slate-100">{t.value}</td>
                <td className="px-3 py-2 text-slate-400">{new Date(t.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

