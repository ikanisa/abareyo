import { createContext, useContext, type ReactNode } from "react";

import type { MobileTheme } from "@/theme";
import { mobileTheme } from "@/theme";

const ThemeContext = createContext<MobileTheme>(mobileTheme);

export const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <ThemeContext.Provider value={mobileTheme}>{children}</ThemeContext.Provider>
);

export const useTheme = () => useContext(ThemeContext);
