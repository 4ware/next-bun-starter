import type en from "../../messages/en.json";

export type Messages = typeof en;

/**
 * Cached message loading for server components. next-intl's request-bound
 * APIs (getTranslations/getMessages) resolve the locale via headers(), which
 * cacheComponents forbids inside "use cache" scopes — so server components
 * load the catalog through this cached function and build translators with
 * next-intl's pure createTranslator instead.
 */
export async function loadMessages(locale: string): Promise<Messages> {
  "use cache";
  return (await import(`../../messages/${locale}.json`)).default;
}
