// Helpers pour generer des objets Schema.org typés a serialiser en JSON-LD.
// Documentation des schemas: https://schema.org

import type { Locale } from "./i18n"

const DOMAIN = "https://founderbacon.com"

// ─── Site-level schemas ───────────────────────────────────────────

export function websiteSchema(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FounderBacon",
    alternateName: "FBCN",
    url: `${DOMAIN}/${locale}`,
    description: "Companion for Fortnite: Save the World. Weapon stats, damage calculator, hero loadouts, perk planner, shareable builds — and an open REST API.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${DOMAIN}/${locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "FounderBacon",
      url: DOMAIN,
      logo: { "@type": "ImageObject", url: `${DOMAIN}/opengraph_image.png` },
    },
  } as const
}

export function softwareAppSchema(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FounderBacon",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    url: `${DOMAIN}/${locale}`,
    description: "Save the World companion: build calculator, weapon stats, hero loadouts, perk planner.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    aggregateRating: undefined,
  } as const
}

// ─── BreadcrumbList ───────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string
  url: string
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${DOMAIN}${item.url}`,
    })),
  } as const
}

// ─── Entites du jeu (weapons, traps, heroes) ───────────────────────

interface ThingInput {
  name: string
  description?: string
  image?: string
  url: string
  category?: string
}

// Schema.org Product est trop commerce-oriented pour des entites in-game.
// On utilise "Thing" generique + ItemPage qui contient le Thing.
export function thingPageSchema(input: ThingInput) {
  const url = input.url.startsWith("http") ? input.url : `${DOMAIN}${input.url}`
  return {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name: input.name,
    description: input.description,
    url,
    mainEntity: {
      "@type": "Thing",
      name: input.name,
      description: input.description,
      ...(input.image && { image: input.image }),
      ...(input.category && { additionalType: input.category }),
      url,
    },
  } as const
}

// ─── Listes (search hubs) ─────────────────────────────────────────

export function itemListSchema(name: string, items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${DOMAIN}${item.url}`,
    })),
  } as const
}

// ─── Article (changelog entries) ──────────────────────────────────

export function articleSchema(input: {
  title: string
  description: string
  url: string
  datePublished: string
  dateModified?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.title,
    description: input.description,
    url: input.url.startsWith("http") ? input.url : `${DOMAIN}${input.url}`,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: { "@type": "Organization", name: "FounderBacon" },
    publisher: {
      "@type": "Organization",
      name: "FounderBacon",
      logo: { "@type": "ImageObject", url: `${DOMAIN}/opengraph_image.png` },
    },
  } as const
}
