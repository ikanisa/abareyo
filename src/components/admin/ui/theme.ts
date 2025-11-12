import { designTokens } from "@rayon/design-tokens";

export const adminTheme = {
  radii: {
    sm: "rounded-xl",
    md: "rounded-2xl",
    lg: "rounded-[1.75rem]",
    pill: "rounded-full",
  },
  surfaces: {
    base: "border border-white/10 bg-slate-950/60 backdrop-blur",
    muted: "border border-white/5 bg-slate-950/40 backdrop-blur",
    inset: "border border-white/5 bg-slate-950/30",
  },
  text: {
    primary: "text-slate-100",
    secondary: "text-slate-400",
    muted: "text-slate-500",
    subtle: "text-slate-500/80",
    accent: "text-sky-300",
    positive: "text-emerald-400",
    negative: "text-rose-400",
    caution: "text-amber-300",
  },
  motion: {
    duration: designTokens.motion.duration,
    easing: designTokens.motion.easing,
  },
  states: {
    interactive: "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-0",
  },
};

export type AdminTheme = typeof adminTheme;
