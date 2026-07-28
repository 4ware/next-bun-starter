import { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getTodosForUser } from "@/server/todos-cache";
import { PICTURE_SIZES } from "@/server/picture";
import { todosKey } from "@/lib/todos";
import { SignOutButton } from "@/components/sign-out-button";
import { LivePanel } from "@/components/realtime/live-panel";
import { TodoPanel } from "@/components/todos/todo-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * With Cache Components the static shell below renders instantly; the
 * session-dependent part streams in via Suspense.
 */
export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <SignOutButton />
      </div>
      <Suspense
        fallback={<p className="text-muted-foreground text-sm" aria-hidden />}
      >
        <SessionContent />
      </Suspense>
      <PictureCard />
      <LivePanel />
    </main>
  );
}

/**
 * The same generated PNG at three sizes via next/image. The source route
 * /picture/[size] is force-static, so in production its bytes live in the
 * Redis-backed incremental cache (see cache-handler.cjs).
 */
function PictureCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimized images</CardTitle>
        <CardDescription>
          One generated PNG served from <code className="font-mono">/picture/[size]</code> — statically cached (Redis
          in production) — rendered by next/image at {PICTURE_SIZES.join(" / ")}px.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-4">
        {PICTURE_SIZES.map((size) => (
          <figure key={size} className="grid justify-items-center gap-1.5">
            <Image
              src={`/picture/${size}`}
              width={size}
              height={size}
              alt={`Generated artwork at ${size}px`}
              className="rounded-lg"
            />
            <figcaption className="text-muted-foreground text-xs">{size}px</figcaption>
          </figure>
        ))}
      </CardContent>
    </Card>
  );
}

async function SessionContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  // Prefetch from the "use cache" function (tagged per user, revalidated by
  // the mutation routes) and hydrate the client query cache, so TodoPanel
  // renders with data instead of a loading state.
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: todosKey,
    queryFn: () => getTodosForUser(session.user.id),
  });

  return (
    <>
      <p className="text-muted-foreground text-sm">
        Signed in as <span className="text-foreground font-medium">{session.user.email}</span>. The example todos API
        lives at <code className="font-mono">/api/todos</code> (Elysia).
      </p>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TodoPanel />
      </HydrationBoundary>
    </>
  );
}
