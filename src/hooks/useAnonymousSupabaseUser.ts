'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Status = 'idle' | 'loading' | 'ready' | 'error';

type AnonymousAuthState = {
  status: Status;
  session: Session | null;
  error: string | null;
  refresh: () => Promise<void>;
};

export const useAnonymousSupabaseUser = (): AnonymousAuthState => {
  const [status, setStatus] = useState<Status>('idle');
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ensureAnonymous = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError('Supabase client missing');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      setStatus('error');
      setError(sessionError.message);
      return;
    }

    if (data.session) {
      setSession(data.session);
      setStatus('ready');
      return;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) {
      setError(signInError.message);
      setStatus('error');
      return;
    }

    if (signInData.session) {
      setSession(signInData.session);
      setStatus('ready');
    } else {
      setStatus('error');
      setError('anonymous_session_missing');
    }
  };

  useEffect(() => {
    void ensureAnonymous();
  }, []);

  return {
    status,
    session,
    error,
    refresh: ensureAnonymous,
  };
};
