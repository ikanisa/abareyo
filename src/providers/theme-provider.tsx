"use client";
import type { ReactNode } from "react";

import { ThemeProvider as NextThemeProvider } from "next-themes";

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => (
  <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
    {children}
  </NextThemeProvider>
);
