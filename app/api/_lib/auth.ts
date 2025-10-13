import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import type { Database } from '@/integrations/supabase/types';

import { errorResponse } from './responses';
import { getSupabase } from './supabase';

type ServiceClient = SupabaseClient<Database>;

type RequireAuthSuccess = { user: User; response?: undefined };
type RequireAuthFailure = { user?: undefined; response: ReturnType<typeof errorResponse> };

const extractBearerToken = (value: string | null) => {
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

const extractAccessToken = (req: NextRequest) => {
  const headerToken = extractBearerToken(req.headers.get('authorization'));
  if (headerToken) return headerToken;

  const cookieToken = req.cookies.get('sb-access-token')?.value;
  if (cookieToken) return cookieToken;

  const supabaseCookie = req.cookies.get('supabase-auth-token')?.value;
  if (supabaseCookie) {
    try {
      const parsed = JSON.parse(supabaseCookie);
      const access = parsed?.currentSession?.access_token;
      if (typeof access === 'string' && access) {
        return access;
      }
    } catch {
      // Ignore JSON parse errors; we'll fall through to returning null.
    }
  }

  return null;
};

export const requireAuthUser = async (
  req: NextRequest,
  client?: ServiceClient,
): Promise<RequireAuthSuccess | RequireAuthFailure> => {
  const accessToken = extractAccessToken(req);
  if (!accessToken) {
    return { response: errorResponse('Authentication required', 401) };
  }

  const supabase = client ?? getSupabase();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) {
    return { response: errorResponse('Authentication required', 401) };
  }

  return { user: data.user };
};
