"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/providers/i18n-provider";

type Locale = "en" | "fr" | "rw";

const LOCALES: Locale[] = ["en", "fr", "rw"];

const names: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  rw: "Kinyarwanda",
};

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const computePath = useMemo(() => {
    const bare = (pathname || "/").replace(/^\/(en|fr|rw)(?=\/|$)/, "") || "/";
    return (to: Locale) => {
      if (to === "en") return bare;
      return bare === "/" ? `/${to}` : `/${to}${bare}`;
    };
  }, [pathname]);

  const handleSelect = (next: Locale) => {
    if (next === locale) {
      return;
    }
    setLocale(next);
    router.push(computePath(next));
  };

  const label = names[(locale as Locale) ?? "en"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="glass"
          size="sm"
          aria-haspopup="listbox"
          aria-label={`Change language, current ${label}`}
          className="inline-flex items-center gap-2"
        >
          <span>{label}</span>
          <ChevronDown className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] bg-slate-950/95 text-slate-100">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-white/60">
          Interface language
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={(locale as Locale) ?? "en"}
          onValueChange={(value) => handleSelect(value as Locale)}
          aria-label="Available languages"
        >
          {LOCALES.map((code) => (
            <DropdownMenuRadioItem key={code} value={code}>
              {names[code]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
