"use client";

import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState } from "react";
import { toast } from "sonner";

/** localStorage key holding the persisted query cache; cleared on sign-out. */
export const QUERY_CACHE_STORAGE_KEY = "next-bun-starter-query-cache";

const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24; // 24h

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong";
}

/**
 * Every failed query or mutation surfaces as a sonner toast from here,
 * so components don't need per-request error handling.
 */
export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (err) => toast.error(errorMessage(err)),
    }),
    mutationCache: new MutationCache({
      onError: (err) => toast.error(errorMessage(err)),
    }),
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        // keep cached data at least as long as the persister's maxAge,
        // otherwise garbage collection would drop it from the snapshot
        gcTime: PERSIST_MAX_AGE,
      },
    },
  });
}

/**
 * QueryClientProvider + cache persistence: the query cache is snapshotted to
 * localStorage, so revisits and reloads render cached data instantly and
 * refetch in the background. On the server the persister is a no-op.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window === "undefined" ? undefined : window.localStorage,
      key: QUERY_CACHE_STORAGE_KEY,
    }),
  );

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: PERSIST_MAX_AGE }}>
      {children}
    </PersistQueryClientProvider>
  );
}
