"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useMemo } from "react";

const SessionContext = createContext<Session | null>(null);

export const SessionProvider = ({ session, children }: { session: Session | null; children: React.ReactNode }) => {
  const value = useMemo(() => session, [session]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => useContext(SessionContext);
