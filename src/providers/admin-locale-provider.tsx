'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AdminLocale = string;

type AdminLocaleContextValue = {
  locale: AdminLocale;
  setLocale: (next: AdminLocale) => void;
  dictionary: Record<string, string>;
  loading: boolean;
  t: (key: string, fallback?: string) => string;
};

const STORAGE_KEY = 'admin:locale';
const DEFAULT_PREFIX = 'admin.nav';

const AdminLocaleContext = createContext<AdminLocaleContextValue | undefined>(undefined);

async function fetchDictionaryForLocale(locale: AdminLocale) {
  const params = new URLSearchParams({ lang: locale, prefix: DEFAULT_PREFIX });
  const response = await fetch(`/admin/api/translations/dictionary?${params.toString()}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to load translation dictionary');
  }
  const payload = (await response.json()) as { data?: Record<string, string> };
  return payload.data ?? {};
}

export const AdminLocaleProvider = ({ defaultLocale = 'en', children }: { defaultLocale?: AdminLocale; children: ReactNode }) => {
  const [locale, setLocaleState] = useState<AdminLocale>(defaultLocale);
  const [dictionary, setDictionary] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as AdminLocale | null;
    if (stored && stored !== locale) {
      setLocaleState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const nextDictionary = await fetchDictionaryForLocale(locale);
        if (!cancelled) {
          setDictionary(nextDictionary);
        }
      } catch (error) {
        console.error('Failed to load admin translation dictionary', error);
        if (!cancelled) {
          setDictionary({});
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const setLocale = useCallback((next: AdminLocale) => {
    setLocaleState(next);
  }, []);

  const value = useMemo<AdminLocaleContextValue>(
    () => ({
      locale,
      setLocale,
      dictionary,
      loading,
      t: (key: string, fallback?: string) => dictionary[key] ?? fallback ?? key,
    }),
    [dictionary, locale, loading, setLocale],
  );

  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>;
};

export const useAdminLocale = () => {
  const context = useContext(AdminLocaleContext);
  if (!context) {
    throw new Error('useAdminLocale must be used within AdminLocaleProvider');
  }
  return context;
};
