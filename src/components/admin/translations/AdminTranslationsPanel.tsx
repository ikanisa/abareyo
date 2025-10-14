'use client';

import { useEffect, useMemo, useState } from 'react';

import type { TranslationRow } from '@/services/admin/translations';
import { useAdminLocale } from '@/providers/admin-locale-provider';

export const AdminTranslationsPanel = ({ languages }: { languages: string[] }) => {
  const { locale, setLocale, loading: localeLoading } = useAdminLocale();
  const [entries, setEntries] = useState<TranslationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedLocale = useMemo(() => {
    if (languages.includes(locale)) {
      return locale;
    }
    return languages[0] ?? 'en';
  }, [languages, locale]);

  useEffect(() => {
    if (locale !== resolvedLocale) {
      setLocale(resolvedLocale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedLocale]);

  useEffect(() => {
    let cancelled = false;
    const fetchEntries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ lang: resolvedLocale, page: '1', pageSize: '50' });
        const response = await fetch(`/admin/api/translations?${params.toString()}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch translations');
        }
        const payload = (await response.json()) as {
          data: TranslationRow[];
          meta?: { total?: number };
        };
        if (!cancelled) {
          setEntries(payload.data ?? []);
          setTotal(payload.meta?.total ?? payload.data?.length ?? 0);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('Unable to load translations for the selected language.');
          setEntries([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    if (resolvedLocale) {
      fetchEntries();
    }

    return () => {
      cancelled = true;
    };
  }, [resolvedLocale]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Translations</h1>
          <p className="text-sm text-slate-400">
            Review and manage bilingual content sourced directly from the Supabase translations table.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">Language</span>
          <div className="flex overflow-hidden rounded-full border border-white/10">
            {languages.map((lang) => {
              const isActive = resolvedLocale === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLocale(lang)}
                  disabled={localeLoading}
                  className={`px-3 py-1 text-xs font-semibold uppercase transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-slate-300">
                <th className="px-3 py-2">Key</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">By</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                    Loading translations…
                  </td>
                </tr>
              ) : entries.length ? (
                entries.map((entry) => (
                  <tr key={`${entry.lang}:${entry.key}`} className="border-t border-white/10">
                    <td className="px-3 py-2 font-mono text-xs text-slate-300">{entry.key}</td>
                    <td className="px-3 py-2 text-slate-100">{entry.value}</td>
                    <td className="px-3 py-2 text-slate-400">{new Date(entry.updatedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-400">{entry.updatedBy ?? '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                    No translations available for this language yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Total entries: {total}</span>
        <span>Showing first 50 records</span>
      </div>
    </div>
  );
};
