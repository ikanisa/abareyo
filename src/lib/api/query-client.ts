import { QueryClient } from "@tanstack/react-query";

import { motionTokens } from "@rayon/design-tokens";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 30 * 60 * 1000,
        staleTime: 60 * 1000,
        retry: 2,
        retryDelay: motionTokens.duration.deliberate,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: 1,
        retryDelay: motionTokens.duration.standard,
      },
    },
  });
