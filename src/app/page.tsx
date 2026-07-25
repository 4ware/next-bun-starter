import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Next Bun Starter</h1>
      <p className="text-muted-foreground max-w-md text-center text-sm">
        Next.js 16 · Bun · Elysia · Drizzle · better-auth · Tailwind v4 · shadcn/ui · TanStack Form · Zod
      </p>
      <div className="flex gap-3">
        {session ? (
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        ) : (
          <>
            <Button asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-up">Create account</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
