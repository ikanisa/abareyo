"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { isEqualShallow } from "./utils";

type FilterRecord = Record<string, string>;

type ParamMap<T extends FilterRecord> = Partial<Record<keyof T, string>>;

type StorageScope = "local" | "session";

export type UseAdminFiltersOptions<T extends FilterRecord> = {
  defaults: T;
  paramMap?: ParamMap<T>;
  storageKey?: string;
  storageScope?: StorageScope;
};

type UseAdminFiltersResult<T extends FilterRecord> = {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  clearFilter: <K extends keyof T>(key: K) => void;
  reset: () => void;
  isDirty: boolean;
};

const getStorage = (scope: StorageScope) => {
  if (typeof window === "undefined") return undefined;
  return scope === "session" ? window.sessionStorage : window.localStorage;
};

const buildStorageKey = (pathname: string | null, storageKey?: string) => {
  if (storageKey) return storageKey;
  return pathname ? `${pathname}::filters` : "admin::filters";
};

const parseStoredFilters = <T extends FilterRecord>(raw: string | null, defaults: T): T | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FilterRecord;
    const next: FilterRecord = { ...defaults };
    let hasMatch = false;
    for (const key of Object.keys(defaults)) {
      const candidate = parsed[key];
      if (typeof candidate === "string") {
        next[key] = candidate;
        hasMatch = true;
      }
    }
    return hasMatch ? (next as T) : null;
  } catch (error) {
    console.warn("Failed to parse admin filter storage", error);
    return null;
  }
};

export const useAdminFilters = <T extends FilterRecord>({
  defaults,
  paramMap = {} as ParamMap<T>,
  storageKey,
  storageScope = "session",
}: UseAdminFiltersOptions<T>): UseAdminFiltersResult<T> => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storage = getStorage(storageScope);
  const resolvedStorageKey = useMemo(() => buildStorageKey(pathname, storageKey), [pathname, storageKey]);

  const defaultsRef = useRef(defaults);
  useEffect(() => {
    if (!isEqualShallow(defaultsRef.current, defaults)) {
      defaultsRef.current = defaults;
    }
  }, [defaults]);
  const stableDefaults = defaultsRef.current;

  const keys = useMemo(() => Object.keys(stableDefaults) as Array<keyof T>, [stableDefaults]);
  const paramEntries = useMemo(() => {
    return new Map(keys.map((key) => [key, (paramMap[key] as string | undefined) ?? String(key)]));
  }, [keys, paramMap]);

  const searchParamsSignature = searchParams?.toString() ?? "";

  const initialFilters = useMemo(() => {
    const fromParams: Partial<T> = {};
    let foundParam = false;
    for (const key of keys) {
      const paramName = paramEntries.get(key)!;
      const value = searchParams?.get(paramName);
      if (typeof value === "string") {
        fromParams[key] = value as T[typeof key];
        foundParam = true;
      }
    }
    if (foundParam) {
      return { ...stableDefaults, ...fromParams } as T;
    }
    if (!storage) {
      return { ...stableDefaults } as T;
    }
    const stored = parseStoredFilters(storage.getItem(resolvedStorageKey), stableDefaults);
    return stored ?? ({ ...stableDefaults } as T);
  }, [keys, paramEntries, resolvedStorageKey, searchParams, stableDefaults, storage]);

  const [filters, setFilters] = useState<T>(initialFilters);
  const pendingSyncRef = useRef(false);

  useEffect(() => {
    if (!storage) return;
    try {
      storage.setItem(resolvedStorageKey, JSON.stringify(filters));
    } catch (error) {
      console.warn("Failed to persist admin filters", error);
    }
  }, [filters, resolvedStorageKey, storage]);

  useEffect(() => {
    if (!pathname) return;
    const currentParams = new URLSearchParams(searchParams?.toString());
    let changed = false;
    for (const key of keys) {
      const paramName = paramEntries.get(key)!;
      const value = filters[key];
      const defaultValue = stableDefaults[key];
      if (value && value !== defaultValue) {
        if (currentParams.get(paramName) !== value) {
          currentParams.set(paramName, value);
          changed = true;
        }
      } else if (currentParams.has(paramName)) {
        currentParams.delete(paramName);
        changed = true;
      }
    }
    if (!changed) return;
    pendingSyncRef.current = true;
    const query = currentParams.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [defaults, filters, keys, paramEntries, pathname, router, searchParamsSignature]);

  useEffect(() => {
    if (pendingSyncRef.current) {
      pendingSyncRef.current = false;
      return;
    }
    setFilters((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of keys) {
        const paramName = paramEntries.get(key)!;
        const value = searchParams?.get(paramName) ?? stableDefaults[key];
        if (next[key] !== value) {
          next[key] = value as T[typeof key];
          changed = true;
        }
      }
      return changed ? (next as T) : prev;
    });
  }, [keys, paramEntries, searchParams, searchParamsSignature, stableDefaults]);

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value } as T;
        return next;
      });
    },
    [],
  );

  const clearFilter = useCallback(
    <K extends keyof T>(key: K) => {
      setFilters((prev) => {
        if (prev[key] === stableDefaults[key]) {
          return prev;
        }
        return { ...prev, [key]: stableDefaults[key] } as T;
      });
    },
    [stableDefaults],
  );

  const reset = useCallback(() => {
    setFilters({ ...stableDefaults });
  }, [stableDefaults]);

  const isDirty = useMemo(() => !isEqualShallow(filters, stableDefaults), [filters, stableDefaults]);

  return { filters, setFilter, clearFilter, reset, isDirty };
};
