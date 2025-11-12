"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type UseAdminSearchOptions = {
  /** Query parameter name to sync with. Defaults to `search`. */
  paramKey?: string;
  /** Optional storage key override. Defaults to `${pathname}::${paramKey}`. */
  storageKey?: string;
  /** Debounce interval in milliseconds applied to the returned `debouncedSearch`. */
  debounceMs?: number;
  /** Persist values in `sessionStorage` instead of the default `localStorage`. */
  storageScope?: "local" | "session";
};

export type AdminSearchState = {
  /** Current input value (not debounced). */
  search: string;
  /** Debounced value that should drive data fetching. */
  debouncedSearch: string;
  /** Indicates whether the debounced value is still settling. */
  isDebouncing: boolean;
  /** Update the search value. */
  setSearch: (value: string) => void;
  /** Clear both the search and the synced query parameter. */
  reset: () => void;
};

const getStorage = (scope: "local" | "session") => {
  if (typeof window === "undefined") return undefined;
  return scope === "session" ? window.sessionStorage : window.localStorage;
};

export const useAdminSearch = ({
  paramKey = "search",
  storageKey,
  debounceMs = 400,
  storageScope = "session",
}: UseAdminSearchOptions = {}): AdminSearchState => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storage = getStorage(storageScope);

  const resolvedStorageKey = useMemo(() => {
    if (storageKey) return storageKey;
    return pathname ? `${pathname}::${paramKey}` : paramKey;
  }, [paramKey, pathname, storageKey]);

  const paramValue = searchParams?.get(paramKey) ?? "";

  const initialSearch = useMemo(() => {
    if (paramValue) return paramValue;
    if (!storage || !resolvedStorageKey) return "";
    try {
      return storage.getItem(resolvedStorageKey) ?? "";
    } catch (error) {
      console.warn("Failed to read admin search storage", error);
      return "";
    }
  }, [paramValue, resolvedStorageKey, storage]);

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const lastSyncedRef = useRef<string>(initialSearch);

  useEffect(() => {
    if (!storage || !resolvedStorageKey) return;
    try {
      if (search) {
        storage.setItem(resolvedStorageKey, search);
      } else {
        storage.removeItem(resolvedStorageKey);
      }
    } catch (error) {
      console.warn("Failed to persist admin search state", error);
    }
  }, [resolvedStorageKey, search, storage]);

  useEffect(() => {
    if (!pathname) return;
    const currentParams = new URLSearchParams(searchParams?.toString());
    const currentValue = currentParams.get(paramKey) ?? "";
    if (search === currentValue) return;
    if (search) {
      currentParams.set(paramKey, search);
    } else {
      currentParams.delete(paramKey);
    }
    const query = currentParams.toString();
    lastSyncedRef.current = search;
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [paramKey, pathname, router, search, searchParams]);

  useEffect(() => {
    const nextValue = paramValue;
    if (typeof nextValue !== "string") return;
    if (nextValue === lastSyncedRef.current) return;
    lastSyncedRef.current = nextValue;
    setSearch(nextValue);
  }, [paramValue]);

  useEffect(() => {
    setIsDebouncing(true);
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search);
      setIsDebouncing(false);
    }, debounceMs);
    return () => {
      window.clearTimeout(handle);
    };
  }, [debounceMs, search]);

  const reset = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setIsDebouncing(false);
  }, []);

  return { search, debouncedSearch, isDebouncing, setSearch, reset };
};
