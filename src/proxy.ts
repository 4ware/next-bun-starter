import createProxy from "next-intl/middleware";
import { routing } from "@/i18n/routing";

/**
 * Next 16 proxy (formerly middleware): resolves the locale from the URL path
 * (/de/dashboard → de), redirects/rewrites accordingly and persists the
 * choice in the NEXT_LOCALE cookie.
 */
export default createProxy(routing);

export const config = {
  // skip API routes, the cached picture route, internals and static files
  matcher: "/((?!api|picture|_next|_vercel|.*\\..*).*)",
};
