import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export type Locale = "uz" | "en" | "ru";
export const locales: Locale[] = ["uz", "en", "ru"];
export const defaultLocale: Locale = "uz";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("LOCALE")?.value as Locale) ?? defaultLocale;
  const safeLocale = locales.includes(locale) ? locale : defaultLocale;

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});
