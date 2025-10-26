declare module 'next-axiom' {
  import type { NextRequest } from 'next/server';

  export type AxiomLogger = {
    info: (...args: unknown[]) => void;
    warn?: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug?: (...args: unknown[]) => void;
  };

  export type AxiomRequest = NextRequest & {
    log: AxiomLogger;
    ip?: string | null;
  };

  export function withAxiom<T extends (req: AxiomRequest, ...args: unknown[]) => unknown>(handler: T): T;
}
