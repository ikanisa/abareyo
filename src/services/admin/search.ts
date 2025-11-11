import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ADMIN_NAV_ITEMS } from '@/config/admin-nav';
import type { AdminModuleKey } from '@/providers/admin-feature-flags-provider';
import { httpClient } from '@/services/http-client';

export type AdminSearchResult = {
  id: string;
  title: string;
  href: string;
  module: AdminModuleKey;
  description?: string | null;
};

const ADMIN_SEARCH_ENDPOINT = '/admin/search';

const FALLBACK_ENTRIES = ADMIN_NAV_ITEMS.map((item) => {
  const searchableText = [
    item.fallback,
    item.key,
    item.description ?? '',
    item.href,
    item.href.replace('/admin/', ''),
    item.module,
    ...(item.keywords ?? []),
  ]
    .join(' ')
    .toLowerCase();

  return {
    result: {
      id: item.href,
      title: item.fallback,
      href: item.href,
      module: item.module,
      description: item.description,
    } satisfies AdminSearchResult,
    searchableText,
  };
});

const computeScore = (haystack: string, query: string) => {
  const terms = query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
  if (terms.length === 0) {
    return 0;
  }
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) {
      score += 1;
    }
  }
  return score;
};

const fallbackSearch = (query: string): AdminSearchResult[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return FALLBACK_ENTRIES
    .map((entry) => ({ entry, score: computeScore(entry.searchableText, normalized) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => entry.result);
};

export async function searchAdminModules(
  query: string,
  options?: { signal?: AbortSignal },
): Promise<AdminSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    return await httpClient.data<AdminSearchResult[]>(ADMIN_SEARCH_ENDPOINT, {
      admin: true,
      searchParams: { q: trimmed },
      signal: options?.signal,
    });
  } catch (error) {
    if (options?.signal?.aborted) {
      throw error;
    }
    console.warn('admin-search: falling back to static index', error);
    return fallbackSearch(trimmed);
  }
}

export type UseAdminSearchOptions = {
  debounceMs?: number;
  minLength?: number;
};

type RunSearchOptions = { immediate?: boolean };

export const useAdminSearch = ({ debounceMs = 250, minLength = 2 }: UseAdminSearchOptions = {}) => {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<AdminSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelOngoing = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const executeSearch = useCallback(
    async (value: string, { immediate = false }: RunSearchOptions = {}) => {
      setQueryState(value);
      cancelOngoing();

      const trimmed = value.trim();
      if (trimmed.length < minLength) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      const run = async () => {
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);
        setError(null);
        try {
          const hits = await searchAdminModules(trimmed, { signal: controller.signal });
          setResults(hits);
        } catch (err) {
          if (controller.signal.aborted) {
            return;
          }
          setError(err as Error);
          setResults([]);
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      };

      if (immediate) {
        void run();
        return;
      }

      timerRef.current = setTimeout(() => {
        void run();
      }, debounceMs);
    },
    [cancelOngoing, debounceMs, minLength],
  );

  const setQuery = useCallback(
    (value: string) => {
      void executeSearch(value, { immediate: false });
    },
    [executeSearch],
  );

  const submit = useCallback(() => {
    return executeSearch(query, { immediate: true });
  }, [executeSearch, query]);

  const clear = useCallback(() => {
    cancelOngoing();
    setQueryState('');
    setResults([]);
    setError(null);
    setLoading(false);
  }, [cancelOngoing]);

  useEffect(() => {
    return () => {
      cancelOngoing();
    };
  }, [cancelOngoing]);

  const state = useMemo(
    () => ({ query, results, loading, error, setQuery, submit, clear }),
    [query, results, loading, error, setQuery, submit, clear],
  );

  return state;
};
