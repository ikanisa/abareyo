import { type ReactNode } from "react";

import { QueryProvider } from "@/api/query-provider";

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  return <QueryProvider>{children}</QueryProvider>;
};
