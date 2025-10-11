"use client";

import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";

type Locale = "en" | "fr" | "rw";

const names: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  rw: "Kinyarwanda",
};

export const LanguageSwitcher = () => {
  const { locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const computePath = (to: Locale) => {
    // Remove any existing locale prefix
    const bare = pathname.replace(/^\/(en|fr|rw)(?=\/|$)/, "") || "/";
    if (to === "en") return bare; // default locale without prefix
    return bare === "/" ? `/${to}` : `/${to}${bare}`;
  };

  const cycle = () => {
    const order: Locale[] = ["en", "fr", "rw"];
    const idx = order.indexOf(locale as Locale);
    const next = order[(idx + 1) % order.length];
    router.push(computePath(next));
  };

  return (
    <Button variant="glass" size="sm" onClick={cycle}>
      {names[locale as Locale]}
    </Button>
  );
};
