"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type AuthContextValue = {
  user: { id: string; role: "guest" | "member" | "admin" } | null;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextValue["user"]>({
    id: "guest",
    role: "guest",
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (userId: string) => {
        setUser({ id: userId, role: "member" });
      },
      logout: async () => {
        setUser({ id: "guest", role: "guest" });
      },
    }),
    [user],
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
