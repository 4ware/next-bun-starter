"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { QUERY_CACHE_STORAGE_KEY } from "@/components/providers";

export function SignOutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await authClient.signOut();
        // drop in-memory and persisted caches so the next account
        // never sees this user's data
        queryClient.clear();
        window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
