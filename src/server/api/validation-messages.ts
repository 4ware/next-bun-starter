import de from "../../../messages/de.json";
import en from "../../../messages/en.json";

/**
 * Localizes API validation errors. The zod validators emit stable message
 * KEYS (e.g. "titleRequired"); the global onError translates them using the
 * request's locale. Messages that aren't known keys (zod's built-in type
 * errors) pass through untranslated.
 */

const catalogs: Record<string, Record<string, string>> = {
  en: en.ApiValidation,
  de: de.ApiValidation,
};

export function detectLocale(request: Request): string {
  const cookie = request.headers.get("cookie");
  const fromCookie = cookie?.match(/(?:^|;\s*)NEXT_LOCALE=([\w-]+)/)?.[1];
  if (fromCookie && fromCookie in catalogs) return fromCookie;

  const firstAccepted = (request.headers.get("accept-language") ?? "")
    .split(",")[0]!
    .trim()
    .toLowerCase()
    .split("-")[0]!;
  return firstAccepted in catalogs ? firstAccepted : "en";
}

export function translateValidationMessage(locale: string, keyOrMessage: string): string {
  return catalogs[locale]?.[keyOrMessage] ?? catalogs.en![keyOrMessage] ?? keyOrMessage;
}
