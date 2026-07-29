"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { QUERY_CACHE_STORAGE_KEY } from "@/components/providers";

export function SignOutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("Dashboard");

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
      {t("signOut")}
    </Button>
  );
}
