import { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getTodosForUser } from "@/server/todos-cache";
import { todosKey } from "@/lib/todos";
import { SignOutButton } from "@/components/sign-out-button";
import { LivePanel } from "@/components/realtime/live-panel";
import { TodoPanel } from "@/components/todos/todo-panel";

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
      <LivePanel />
    </main>
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
