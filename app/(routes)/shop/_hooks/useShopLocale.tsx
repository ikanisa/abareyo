"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getSecondaryLocale, type LocalizedField, type ShopLocale } from "../_data/locales";
import copy from "../_data/copy.json";

import { reportMarketplaceEvent } from "../_logic/telemetry";

type LocalizedString = LocalizedField;

type BilingualString = { primary: string; secondary: string };
type ReplacementValue = string | number | BilingualString;
type CopyReplacements = Record<string, ReplacementValue>;

const SHOP_COPY = copy as { readonly [Key in keyof typeof copy]: LocalizedString };

type CopyKey = keyof typeof SHOP_COPY;

const formatTemplate = (
  template: string,
  replacements: CopyReplacements | undefined,
  variant: "primary" | "secondary",
) => {
  if (!replacements) return template;
  return template.replace(/{{\s*(.*?)\s*}}/g, (_, token: string) => {
    const key = token.trim();
    const value = replacements[key];
    if (value == null) return "";
    if (typeof value === "object" && "primary" in value && "secondary" in value) {
      return String(value[variant] ?? "");
    }
    return String(value);
  });
};

const readLocaleCookie = (): ShopLocale | undefined => {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|; )abareyo:shop-locale=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : undefined;
  if (value === "en" || value === "rw") return value;
  return undefined;
};

const writeLocaleCookie = (value: ShopLocale) => {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365; // one year
  document.cookie = `abareyo:shop-locale=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const resolveInitialLocale = (initialLocale?: ShopLocale): ShopLocale => {
  if (initialLocale === "en" || initialLocale === "rw") return initialLocale;
  const cookieLocale = readLocaleCookie();
  if (cookieLocale) return cookieLocale;
  if (typeof navigator !== "undefined") {
    const language = navigator.language?.toLowerCase?.();
    if (language?.startsWith("rw")) return "rw";
  }
  return "en";
};

type ShopLocaleContextValue = {
  locale: ShopLocale;
  setLocale: (next: ShopLocale) => void;
  t: (key: CopyKey, replacements?: CopyReplacements) => BilingualString;
  translateField: (field: LocalizedField) => BilingualString;
  selectField: (field: LocalizedField) => string;
};

const ShopLocaleContext = createContext<ShopLocaleContextValue | undefined>(undefined);

const LOCALE_KEY = "abareyo:shop-locale";
const ShopLocaleProvider = ({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: ShopLocale;
}) => {
  const [locale, setLocaleState] = useState<ShopLocale>(() => resolveInitialLocale(initialLocale));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (stored === "en" || stored === "rw") {
      setLocaleState(stored);
      writeLocaleCookie(stored);
      return;
    }
    const cookieLocale = readLocaleCookie();
    if (cookieLocale) {
      setLocaleState(cookieLocale);
    }
  }, [initialLocale]);

  const setLocale = useCallback((next: ShopLocale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_KEY, next);
    }
    writeLocaleCookie(next);
    reportMarketplaceEvent({ event: "marketplace.locale.changed", locale: next });
  }, []);

  const value = useMemo<ShopLocaleContextValue>(() => {
    return {
      locale,
      setLocale,
      t: (key, replacements) => {
        const entry = SHOP_COPY[key];
        if (!entry) return { primary: key, secondary: key };
        const primary = formatTemplate(entry[locale], replacements, "primary");
        const secondaryLocale = getSecondaryLocale(locale);
        const secondary = formatTemplate(entry[secondaryLocale], replacements, "secondary");
        return { primary, secondary };
      },
      translateField: (field) => ({
        primary: field[locale],
        secondary: field[getSecondaryLocale(locale)],
      }),
      selectField: (field) => field[locale],
    };
  }, [locale, setLocale]);

  return <ShopLocaleContext.Provider value={value}>{children}</ShopLocaleContext.Provider>;
};

export { ShopLocaleProvider };

export const useShopLocale = () => {
  const context = useContext(ShopLocaleContext);
  if (!context) {
    throw new Error("useShopLocale must be used within a ShopLocaleProvider");
  }
  return context;
};

export type { CopyKey, ShopLocale, BilingualString, CopyReplacements, LocalizedField };
