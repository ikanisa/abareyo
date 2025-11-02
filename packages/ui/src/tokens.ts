import tokensData from "./tokens.json" assert { type: "json" };

type FontScale = [string, string];

interface TypographyTokenShape {
  fontFamily: Record<"sans" | "display" | "mono", string>;
  fontSize: Record<"xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl", FontScale>;
  fontWeight: Record<"regular" | "medium" | "semibold" | "bold" | "extrabold", string>;
  letterSpacing: Record<"tight" | "relaxed" | "loose", string>;
}

interface GlassTokenShape {
  blur: string;
  backgrounds: Record<"light" | "dark", string>;
  borders: Record<"light" | "dark", string>;
  shadows: Record<"surfaceLight" | "surfaceDark" | "glow" | "glowAccent", string>;
  overlays: Record<"frosted", string>;
}

interface TokenSchema {
  typography: TypographyTokenShape;
  spacing: Record<string, string>;
  gradients: Record<string, string>;
  glass: GlassTokenShape;
}

const tokens = tokensData as TokenSchema;

export const typography = tokens.typography;
export const spacing = tokens.spacing;
export const gradients = tokens.gradients;
export const glass = tokens.glass;

export type TypographyTokens = typeof typography;
export type SpacingTokens = typeof spacing;
export type GradientTokens = typeof gradients;
export type GlassTokens = typeof glass;
