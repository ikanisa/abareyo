import { type ReactNode } from "react";

import { SupabaseProvider } from "@/api/SupabaseProvider";
import { QueryProvider } from "@/api/query-provider";

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SupabaseProvider>
      <QueryProvider>{children}</QueryProvider>
    </SupabaseProvider>
  );
};
