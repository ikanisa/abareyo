"use client";
import type { ReactNode } from "react";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchFanSession, finalizeFanOnboarding, loginWithSupabaseToken, logoutFan } from "@/lib/api/fan";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FanSession } from "@/lib/api/fan";

type FanSessionData = Awaited<ReturnType<typeof fetchFanSession>>;
type FanUser = FanSession["user"];

type AuthContextValue = {
  session: FanSessionData;
  user: FanUser | null;
  onboardingStatus: string | null;
  loading: boolean;
  login: (sessionId: string) => Promise<void>;
  completeWhatsappLogin: (payload: { accessToken: string; refreshToken?: string | null }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  const sessionQuery = useQuery({
    queryKey: ['fan', 'session'],
    queryFn: fetchFanSession,
    retry: false,
    staleTime: 0,
  });

  const loginMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await finalizeFanOnboarding({ sessionId });
      await queryClient.invalidateQueries({ queryKey: ['fan', 'session'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logoutFan();
      await queryClient.invalidateQueries({ queryKey: ['fan', 'session'] });
    },
  });

  const whatsappLoginMutation = useMutation({
    mutationFn: async ({ accessToken, refreshToken }: { accessToken: string; refreshToken?: string | null }) => {
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? accessToken,
      });

      if (error) {
        throw new Error(error.message);
      }

      await loginWithSupabaseToken({ accessToken });
      await queryClient.invalidateQueries({ queryKey: ['fan', 'session'] });
    },
  });

  const value = useMemo(() => {
    const data = sessionQuery.data ?? null;
    return {
      session: data,
      user: data?.user ?? null,
      onboardingStatus: data?.onboardingStatus ?? null,
      loading:
        sessionQuery.isLoading ||
        sessionQuery.isFetching ||
        loginMutation.isPending ||
        logoutMutation.isPending ||
        whatsappLoginMutation.isPending,
      login: async (sessionId: string) => {
        await loginMutation.mutateAsync(sessionId);
      },
      completeWhatsappLogin: async ({ accessToken, refreshToken }) => {
        await whatsappLoginMutation.mutateAsync({ accessToken, refreshToken });
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
      refresh: async () => {
        await queryClient.invalidateQueries({ queryKey: ['fan', 'session'] });
      },
    };
  }, [
    loginMutation,
    loginMutation.isPending,
    logoutMutation,
    logoutMutation.isPending,
    whatsappLoginMutation,
    whatsappLoginMutation.isPending,
    queryClient,
    sessionQuery.data,
    sessionQuery.isFetching,
    sessionQuery.isLoading,
  ]) as AuthContextValue;

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let cancelled = false;

    const ensureSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!data.session) {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.warn('[auth] Failed to initialise anonymous Supabase session', error.message);
          }
        }
      } catch (error) {
        console.warn('[auth] Unable to verify Supabase session', error);
      }
    };

    ensureSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
      await queryClient.invalidateQueries({ queryKey: ['fan', 'session'] });
    });

    return () => {
      cancelled = true;
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
