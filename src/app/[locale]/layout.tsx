import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { loadMessages } from "@/i18n/messages";
import { routing } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";

export const metadata: Metadata = {
  title: "Next Bun Starter",
  description: "Next.js 16 + Bun + Elysia + Drizzle + better-auth boilerplate",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // explicit locale + "use cache" keeps this statically renderable
  const messages = await loadMessages(locale);

  return (
    <html lang={locale}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <LanguageSwitcher />
            {children}
          </Providers>
          <Toaster richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
