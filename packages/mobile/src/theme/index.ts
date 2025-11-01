import { gradientTokens, spacingTokens, typographyTokens } from "@rayon/design-tokens";

export const mobileTheme = {
  colors: {
    background: "#040611",
    surface: "rgba(12, 16, 32, 0.78)",
    border: "rgba(255,255,255,0.12)",
    text: "rgba(255,255,255,0.92)",
    subtext: "rgba(255,255,255,0.64)",
    accent: "#00A1DE",
    success: "#2CC081",
  },
  gradients: gradientTokens,
  spacing: spacingTokens,
  typography: typographyTokens,
};

export type MobileTheme = typeof mobileTheme;
