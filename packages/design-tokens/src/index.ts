export type GradientToken =
  | "hero"
  | "accent"
  | "success"
  | "gold"
  | "surface";

export const gradientTokens: Record<GradientToken, string> = {
  hero: "linear-gradient(135deg, rgba(0, 52, 128, 0.95) 0%, rgba(0, 163, 255, 0.85) 52%, rgba(253, 215, 73, 0.85) 100%)",
  accent: "linear-gradient(120deg, rgba(0, 38, 255, 0.94) 0%, rgba(28, 195, 255, 0.8) 50%, rgba(98, 255, 224, 0.8) 100%)",
  success: "linear-gradient(120deg, rgba(32, 96, 61, 0.95) 0%, rgba(12, 162, 142, 0.85) 48%, rgba(177, 255, 185, 0.8) 100%)",
  gold: "linear-gradient(118deg, rgba(255, 224, 102, 0.95) 0%, rgba(255, 181, 71, 0.9) 50%, rgba(255, 245, 204, 0.85) 100%)",
  surface: "linear-gradient(155deg, rgba(20, 24, 42, 0.92) 0%, rgba(27, 33, 63, 0.85) 38%, rgba(16, 18, 30, 0.94) 100%)",
};

export type FontToken = "sans" | "display" | "mono";

export const typographyTokens = {
  fontFamily: {
    sans: "'Inter', 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "'Sora', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Menlo', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  } satisfies Record<FontToken, string>,
  fontSize: {
    xs: ["0.75rem", "1.125rem"],
    sm: ["0.875rem", "1.35rem"],
    base: ["1rem", "1.5rem"],
    lg: ["1.125rem", "1.625rem"],
    xl: ["1.25rem", "1.85rem"],
    "2xl": ["1.5rem", "2.05rem"],
    "3xl": ["1.875rem", "2.4rem"],
    "4xl": ["2.25rem", "2.75rem"],
  } satisfies Record<string, [string, string]>,
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  letterSpacing: {
    tight: "-0.015em",
    relaxed: "0.025em",
    loose: "0.08em",
  },
};

export type SpacingToken =
  | "0"
  | "px"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl";

export const spacingTokens: Record<SpacingToken, string> = {
  "0": "0px",
  px: "1px",
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  "2xl": "2rem",
  "3xl": "2.5rem",
  "4xl": "3rem",
};

export const motionTokens = {
  duration: {
    instant: 0,
    fast: 160,
    standard: 200,
    deliberate: 250,
    slow: 320,
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0.38, 0.9)",
    emphasize: "cubic-bezier(0.05, 0.7, 0.1, 1)",
    entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.16, 0, 0.13, 1)",
  },
  reduced: {
    key: "rayon:motion",
    mediaQuery: "(prefers-reduced-motion: reduce)",
  },
  toSeconds(duration: number) {
    return duration / 1000;
  },
  toMs(duration: number) {
    return `${duration}ms`;
  },
};

export const designTokens = {
  gradients: gradientTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  motion: motionTokens,
};

export type DesignTokens = typeof designTokens;
