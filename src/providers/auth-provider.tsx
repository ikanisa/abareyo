"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithPassword: (payload: { email: string; password: string }) => Promise<void>;
  signUp: (payload: { email: string; password: string }) => Promise<void>;
  sendMagicLink: (payload: { email: string }) => Promise<void>;
  resetPassword: (payload: { email: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(supabase));

  const initialiseSession = useCallback(async () => {
    if (!supabase) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("[auth] Unable to fetch session", error.message);
    }
    setSession(data.session ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void initialiseSession();
    if (!supabase) {
      return undefined;
    }

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  }, [initialiseSession, supabase]);

  const signInWithPassword = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      if (!supabase) throw new Error("Supabase client unavailable");
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) throw new Error(error.message);
      setSession(data.session ?? null);
    },
    [supabase],
  );

  const signUp = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      if (!supabase) throw new Error("Supabase client unavailable");
      setLoading(true);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/login` },
      });
      setLoading(false);
      if (error) throw new Error(error.message);
      setSession(data.session ?? null);
    },
    [supabase],
  );

  const sendMagicLink = useCallback(
    async ({ email }: { email: string }) => {
      if (!supabase) throw new Error("Supabase client unavailable");
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/login` },
      });
      setLoading(false);
      if (error) throw new Error(error.message);
    },
    [supabase],
  );

  const resetPassword = useCallback(
    async ({ email }: { email: string }) => {
      if (!supabase) throw new Error("Supabase client unavailable");
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/login`,
      });
      setLoading(false);
      if (error) throw new Error(error.message);
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) throw new Error(error.message);
    setSession(null);
  }, [supabase]);

  const refresh = useCallback(async () => {
    await initialiseSession();
  }, [initialiseSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithPassword,
      signUp,
      sendMagicLink,
      resetPassword,
      logout,
      refresh,
    }),
    [loading, logout, resetPassword, sendMagicLink, session, signInWithPassword, signUp, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
