import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    ip?: string;
    headers?: Record<string, unknown>;
    metricsStart?: number;
    adminUser?: { id: string } | null;
    adminSession?: unknown;
    adminPermissions?: Set<string> | string[] | null;
    cookies?: Record<string, string>;
  }
}

