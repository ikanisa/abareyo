"use client";

import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useI18n();
  const nextLocale = locale === 'rw' ? 'en' : 'rw';

  return (
    <Button variant="glass" size="sm" onClick={() => setLocale(nextLocale)}>
      {locale === 'rw' ? 'English' : 'Kinyarwanda'}
    </Button>
  );
};
