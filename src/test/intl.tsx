import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";

/** Wraps components under test with English messages. */
export function IntlWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      {children}
    </NextIntlClientProvider>
  );
}
