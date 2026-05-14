import type { Metadata } from "next"
import type { Locale } from "./i18n"

const DOMAIN = "https://founderbacon.com"

// Construit canonical + hreflang pour une page locale-aware.
// `path` doit commencer par "/" et exclure le prefixe locale.
// Ex : pageAlternates("fr", "/heroes/raven-leader") ->
//   canonical: https://founderbacon.com/fr/heroes/raven-leader
//   en, fr, x-default sur les URLs equivalentes.
export function pageAlternates(locale: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: `${DOMAIN}/${locale}${path}`,
    languages: {
      en: `${DOMAIN}/en${path}`,
      fr: `${DOMAIN}/fr${path}`,
      "x-default": `${DOMAIN}/en${path}`,
    },
  }
}
