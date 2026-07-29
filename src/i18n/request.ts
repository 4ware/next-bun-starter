import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Static request config: it must not read `requestLocale` (that resolves via
 * headers(), which cacheComponents forbids inside "use cache" scopes, and
 * NextIntlClientProvider touches the config during serialization). The app
 * never relies on it — the [locale] layout passes locale + messages to
 * NextIntlClientProvider explicitly, and server components build translators
 * via createTranslator + loadMessages (see src/i18n/messages.ts).
 */
export default getRequestConfig(async () => {
  const locale = routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
