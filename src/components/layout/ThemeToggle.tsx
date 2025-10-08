"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/providers/i18n-provider";

export const ThemeToggle = () => {
  const { t } = useI18n();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveTheme = theme === "system" ? resolvedTheme : theme;
  const nextTheme = effectiveTheme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="glass"
      size="sm"
      type="button"
      aria-label={mounted ? t("actions.toggleTheme", "Toggle theme") : "Toggle color mode"}
      onClick={() => setTheme(nextTheme)}
      disabled={!mounted}
      className="gap-2"
    >
      {effectiveTheme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="text-xs font-semibold uppercase tracking-wide">
        {mounted
          ? t(effectiveTheme === "dark" ? "theme.light" : "theme.dark", "Theme")
          : t("actions.toggleTheme", "Theme")}
      </span>
    </Button>
  );
};
