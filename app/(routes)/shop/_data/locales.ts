export const SUPPORTED_LOCALES = ["en", "rw"] as const;

export type ShopLocale = (typeof SUPPORTED_LOCALES)[number];

export type LocalizedField = Record<ShopLocale, string>;

export const getSecondaryLocale = (locale: ShopLocale): ShopLocale => (locale === "en" ? "rw" : "en");

export const makeLocalizedField = (en: string, rw: string): LocalizedField => ({ en, rw });
