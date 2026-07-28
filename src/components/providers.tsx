"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

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
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
