"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

const Strings = {
  en: { buy: "Buy", pay: "Pay", redeem: "Redeem" },
  rw: { buy: "Gura", pay: "Ishura", redeem: "Kubikuza" },
};

type StringsMap = typeof Strings;
type TranslationKey = keyof StringsMap["en"];

const Ctx = createContext<{
  lang: "en" | "rw";
  t: (k: TranslationKey, fallback?: string) => string;
  setLang: (lang: "en" | "rw") => void;
}>({
  lang: "rw",
  t: () => "",
  setLang: () => undefined,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<"en" | "rw">("rw");
  const t = (key: TranslationKey, fallback?: string) => Strings[lang]?.[key] || fallback || key;
  return <Ctx.Provider value={{ lang, t, setLang }}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx);
}
