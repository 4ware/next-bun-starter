"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Fixed top-right EN/DE toggle; keeps the current path when switching. */
export function LanguageSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="fixed top-4 right-4 z-50 flex gap-2 text-xs font-medium">
      {routing.locales.map((candidate) => (
        <Link
          key={candidate}
          href={pathname}
          locale={candidate}
          aria-current={candidate === locale ? "true" : undefined}
          className={cn(
            "uppercase underline-offset-4 hover:underline",
            candidate === locale ? "text-foreground underline" : "text-muted-foreground",
          )}
        >
          {candidate}
        </Link>
      ))}
    </nav>
  );
}
