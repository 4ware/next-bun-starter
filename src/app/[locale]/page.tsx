import { Suspense } from "react";
import { createTranslator } from "next-intl";
import { loadMessages } from "@/i18n/messages";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Cache Components: the shell is a "use cache" component (translations are
 * cached IO); the session-dependent call to action is slotted in as children
 * and streams via Suspense.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <HomeShell locale={locale}>
      <Suspense fallback={<div className="h-9" aria-hidden />}>
        <CallToAction locale={locale} />
      </Suspense>
    </HomeShell>
  );
}

async function HomeShell({ locale, children }: { locale: string; children: React.ReactNode }) {
  "use cache";
  const t = createTranslator({ locale, messages: await loadMessages(locale), namespace: "Home" });

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground max-w-md text-center text-sm">{t("tagline")}</p>
      {children}
    </main>
  );
}

async function CallToAction({ locale }: { locale: string }) {
  const t = createTranslator({ locale, messages: await loadMessages(locale), namespace: "Home" });
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex gap-3">
      {session ? (
        <Button asChild>
          <Link href="/dashboard">{t("goToDashboard")}</Link>
        </Button>
      ) : (
        <>
          <Button asChild>
            <Link href="/sign-in">{t("signIn")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sign-up">{t("createAccount")}</Link>
          </Button>
        </>
      )}
    </div>
  );
}
