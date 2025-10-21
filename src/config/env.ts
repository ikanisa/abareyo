import { clientEnv as validatedClientEnv, serverEnv as validatedServerEnv } from '../../config/validated-env.mjs';

export const serverEnv = validatedServerEnv;
export const clientEnv = validatedClientEnv;

type ServerEnv = typeof serverEnv;
type ClientEnv = typeof clientEnv;

export type { ClientEnv, ServerEnv };
