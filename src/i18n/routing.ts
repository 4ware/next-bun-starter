import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de"],
  defaultLocale: "en",
  // English stays unprefixed (/dashboard), German gets /de/dashboard
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
