declare module '@sentry/nextjs' {
  export function captureException(error: unknown): void;
  export function captureMessage(message: string): void;
  export function withScope(cb: (scope: { setContext: (name: string, ctx: Record<string, unknown>) => void; setLevel: (level: string) => void }) => void): void;
}

