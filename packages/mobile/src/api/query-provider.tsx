import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { motionTokens } from "@rayon/design-tokens";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 15 * 60 * 1000,
        staleTime: 60 * 1000,
        retry: 2,
        retryDelay: motionTokens.duration.deliberate,
      },
      mutations: {
        retry: 1,
        retryDelay: motionTokens.duration.standard,
      },
    },
  });

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [client] = useState(createQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
