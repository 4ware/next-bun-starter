import { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { createTranslator } from "next-intl";
import { loadMessages } from "@/i18n/messages";
import Image from "next/image";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { getTodosForUser } from "@/server/todos-cache";
import { PICTURE_SIZES } from "@/server/picture";
import { todosKey } from "@/lib/todos";
import { redirect } from "@/i18n/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { LivePanel } from "@/components/realtime/live-panel";
import { TodoPanel } from "@/components/todos/todo-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Cache Components: the shell (title, picture card, live panel) is a
 * "use cache" component; the session-dependent part is slotted in as
 * children and streams via Suspense.
 */
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <DashboardShell locale={locale}>
      <Suspense fallback={<p className="text-muted-foreground text-sm" aria-hidden />}>
        <SessionContent locale={locale} />
      </Suspense>
    </DashboardShell>
  );
}

async function DashboardShell({ locale, children }: { locale: string; children: React.ReactNode }) {
  "use cache";
  const t = createTranslator({ locale, messages: await loadMessages(locale), namespace: "Dashboard" });

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <SignOutButton />
      </div>
      {children}
      <PictureCard locale={locale} />
      <LivePanel />
    </main>
  );
}

/**
 * The same generated PNG at three sizes via next/image. The source route
 * /picture/[size] is statically cached, so in production its bytes live in
 * the Redis-backed incremental cache (see cache-handler.cjs).
 */
async function PictureCard({ locale }: { locale: string }) {
  "use cache";
  const t = createTranslator({ locale, messages: await loadMessages(locale), namespace: "Pictures" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t.rich("description", {
            code: (chunks) => <code className="font-mono">{chunks}</code>,
            sizes: PICTURE_SIZES.join(" / "),
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-4">
        {PICTURE_SIZES.map((size) => (
          <figure key={size} className="grid justify-items-center gap-1.5">
            <Image
              src={`/picture/${size}`}
              width={size}
              height={size}
              alt={t("alt", { size })}
              className="rounded-lg"
            />
            <figcaption className="text-muted-foreground text-xs">{size}px</figcaption>
          </figure>
        ))}
      </CardContent>
    </Card>
  );
}

async function SessionContent({ locale }: { locale: string }) {
  const t = createTranslator({ locale, messages: await loadMessages(locale), namespace: "Dashboard" });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect({ href: "/sign-in", locale });

  // Prefetch from the "use cache" function (tagged per user, revalidated by
  // the mutation routes) and hydrate the client query cache, so TodoPanel
  // renders with data instead of a loading state.
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: todosKey,
    queryFn: () => getTodosForUser(session!.user.id),
  });

  return (
    <>
      <p className="text-muted-foreground text-sm">
        {t.rich("signedInAs", {
          email: () => <span className="text-foreground font-medium">{session!.user.email}</span>,
          code: (chunks) => <code className="font-mono">{chunks}</code>,
        })}
      </p>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TodoPanel />
      </HydrationBoundary>
    </>
  );
}
