import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { api } from "@/server/api";
import { todosKey } from "@/lib/todos";
import { SignOutButton } from "@/components/sign-out-button";
import { LivePanel } from "@/components/realtime/live-panel";
import { TodoPanel } from "@/components/todos/todo-panel";

export default async function DashboardPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) redirect("/sign-in");

  // Prefetch todos through the Elysia app in-process (no HTTP round trip,
  // same auth + wire format as the client) and hydrate the query cache, so
  // TodoPanel renders with data instead of a loading state.
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: todosKey,
    queryFn: async () => {
      const res = await api.handle(new Request("http://localhost/api/todos", { headers: requestHeaders }));
      if (!res.ok) throw new Error(`Prefetch failed (${res.status})`);
      return res.json();
    },
  });

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <SignOutButton />
      </div>
      <p className="text-muted-foreground text-sm">
        Signed in as <span className="text-foreground font-medium">{session.user.email}</span>. The example todos API
        lives at <code className="font-mono">/api/todos</code> (Elysia).
      </p>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TodoPanel />
      </HydrationBoundary>
      <LivePanel />
    </main>
  );
}
