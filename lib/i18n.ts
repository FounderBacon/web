import type en from "@/lang/en.json"

export const locales = ["en", "fr"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "en"

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

type Dictionary = typeof en

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return import(`@/lang/${locale}.json`).then((m) => m.default)
}
