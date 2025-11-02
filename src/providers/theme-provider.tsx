"use client";
import type { ReactNode } from "react";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { } from "react";

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => (
  <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
    {children}
  </NextThemeProvider>
);
