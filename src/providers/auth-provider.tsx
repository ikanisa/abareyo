"use client";

import { createContext, ReactNode, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchFanSession, finalizeFanOnboarding, logoutFan } from "@/lib/api/fan";

type FanSessionData = Awaited<ReturnType<typeof fetchFanSession>>;
type FanUser = FanSessionData extends { user: infer U } ? U : null;

type AuthContextValue = {
  session: FanSessionData;
  user: FanUser | null;
  onboardingStatus: string | null;
  loading: boolean;
  login: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

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
        logoutMutation.isPending,
      login: async (sessionId: string) => {
        await loginMutation.mutateAsync(sessionId);
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
    queryClient,
    sessionQuery.data,
    sessionQuery.isFetching,
    sessionQuery.isLoading,
  ]) as AuthContextValue;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
