import type { z } from 'zod';

import {
  clientEnv as validatedClientEnv,
  envSchema,
  runtimeConfig as validatedRuntimeConfig,
  serverEnv as validatedServerEnv,
} from '../../config/validated-env.mjs';

export const serverEnv = validatedServerEnv;
export const clientEnv = validatedClientEnv;
export const runtimeConfig = validatedRuntimeConfig;

type ServerEnv = typeof serverEnv;
type ClientEnv = typeof clientEnv;
type RuntimeConfig = typeof runtimeConfig;
type RuntimeEnv = z.infer<typeof envSchema>;

export type { ClientEnv, RuntimeConfig, RuntimeEnv, ServerEnv };
