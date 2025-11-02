import { useState, type ReactNode } from "react";
import {
  PersistQueryClientProvider,
  type PersistQueryClientProviderProps,
} from "@tanstack/react-query-persist-client";
import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

import { motionTokens } from "@rayon/design-tokens";

import { mmkvStorage } from "@/storage/mmkv";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 30 * 60 * 1000,
        staleTime: 2 * 60 * 1000,
        retry: 2,
        retryDelay: motionTokens.duration.deliberate,
      },
      mutations: {
        retry: 1,
        retryDelay: motionTokens.duration.standard,
      },
    },
  });

const persister = createSyncStoragePersister({
  storage: mmkvStorage,
  key: "gikundiro:react-query",
});

const persistOptions: PersistQueryClientProviderProps["persistOptions"] = {
  persister,
  maxAge: 12 * 60 * 60 * 1000,
  dehydrateOptions: {
    shouldDehydrateQuery: ({ queryKey }) => !String(queryKey[0]).startsWith("session"),
  },
};

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [client] = useState(createQueryClient);

  return (
    <PersistQueryClientProvider client={client} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  );
};
