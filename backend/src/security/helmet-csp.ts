// Helper to register fastify-helmet with a stricter default CSP.
// Replace existing helmet registration in backend/src/main.ts with a call to registerCsp(fastifyInstance, options).
import type { FastifyInstance } from 'fastify';
import fastifyHelmet, { type FastifyHelmetOptions } from '@fastify/helmet';

export function registerCsp(instance: FastifyInstance, extraConnectSrc: string[] = []) {
  const connectSrc = new Set<string>(["'self'"]);
  extraConnectSrc.forEach((v) => connectSrc.add(v));

  // NOTE: we intentionally REMOVE 'unsafe-inline' for script/style sources.
  // Migration plan: add nonce support to your templating or App Router SSR layer and then
  // switch to per-request nonces (recommended) or use script/style hashes.
  const helmetOptions: FastifyHelmetOptions = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        styleSrc: ["'self'", 'https:'], // removed 'unsafe-inline'
        scriptSrc: ["'self'", 'https:'], // removed 'unsafe-inline'
        connectSrc: Array.from(connectSrc),
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    },
  };

  return instance.register(fastifyHelmet, helmetOptions);
}
