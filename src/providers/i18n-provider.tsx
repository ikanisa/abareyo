"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

const LOCALSTORAGE_KEY = "rayon-locale";

const dictionaries = {
  rw: {
    nav: {
      home: "Ahabanza",
      matches: "Imikino",
      tickets: "Amatike",
      shop: "Iduka",
      community: "Abafana",
      more: "Ibindi",
      wallet: "Umufuka",
      membership: "Ubunyamuryango",
      fundraising: "Inkunga",
      events: "Ibikorwa",
      transfer: "Ohereza itike",
      profile: "Umwirondoro",
      settings: "Igenamiterere",
      language: "Ururimi",
      support: "Ifashanyo",
      moderation: "Kugenzura",
      realtime: "Igihe nyacyo",
      missions: "Imyitozo y'abafana",
      ticketAnalytics: "Isesengura ry'amatike",
    },
    actions: {
      changeLanguage: "Hindura ururimi",
      toggleTheme: "Hindura urumuri",
    },
    copy: {
      moreSubtitle: "Konti n'igenamiterere",
    },
    theme: {
      light: "Rumuri",
      dark: "Umukara",
    },
  },
  en: {
    nav: {
      home: "Home",
      matches: "Matches",
      tickets: "Tickets",
      shop: "Shop",
      community: "Community",
      more: "More",
      wallet: "Wallet",
      membership: "Membership",
      fundraising: "Fundraising",
      events: "Events",
      transfer: "Transfer Ticket",
      profile: "Profile",
      settings: "Settings",
      language: "Language",
      support: "Help & Support",
      moderation: "Admin Moderation",
      realtime: "Realtime Monitor",
      missions: "Fan Missions",
      ticketAnalytics: "Ticket Analytics",
    },
    actions: {
      changeLanguage: "Change language",
      toggleTheme: "Toggle theme",
    },
    copy: {
      moreSubtitle: "Account & settings",
    },
    theme: {
      light: "Light",
      dark: "Dark",
    },
  },
} as const;

type Locale = keyof typeof dictionaries;

type I18nContextValue = {
  locale: Locale;
  t: <T extends string>(path: string, fallback?: T) => string;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('rw');

  useEffect(() => {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY) as Locale | null;
    if (stored && stored in dictionaries) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (value: Locale) => {
    setLocaleState(value);
    localStorage.setItem(LOCALSTORAGE_KEY, value);
  };

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    t: (path: string, fallback = path) => {
      const segments = path.split('.');
      let current: any = dictionaries[locale];
      for (const segment of segments) {
        current = current?.[segment];
        if (!current) {
          return fallback;
        }
      }
      return typeof current === 'string' ? current : fallback;
    },
    setLocale,
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
};
