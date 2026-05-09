import type { Metadata } from "next"
import { locales, isValidLocale, type Locale } from "@/lib/i18n"
import { notFound } from "next/navigation"

const DOMAIN = "https://founderbacon.com"

const SEO: Record<Locale, {
  title: string
  description: string
  ogTitle: string
  ogDescription: string
  ogImageAlt: string
  twitterTitle: string
  twitterDescription: string
  ogLocale: string
  keywords: string[]
}> = {
  en: {
    title: "FounderBacon — Save the World Companion",
    description: "Companion for Fortnite: Save the World. Weapon stats, damage calculator, hero loadouts, perk planner, shareable builds — and an open REST API for developers.",
    ogTitle: "FounderBacon — Save the World Companion",
    ogDescription: "Build calculator, weapon stats, hero loadouts, perk planner and shareable builds for Fortnite: Save the World. Plus an open REST API.",
    ogImageAlt: "FounderBacon — Save the World companion",
    twitterTitle: "FounderBacon — Save the World Companion",
    twitterDescription: "Weapon stats, build calculator, hero loadouts, shareable builds. Plus an open REST API.",
    ogLocale: "en_US",
    keywords: [
      "Fortnite Save the World",
      "STW companion",
      "Save the World companion",
      "STW build calculator",
      "STW weapon calculator",
      "STW damage calculator",
      "STW hero loadout",
      "STW perk planner",
      "STW build sharing",
      "Save the World tools",
      "Fortnite STW",
      "STW API",
      "weapon stats",
      "schematics",
      "crafting recipes",
    ],
  },
  fr: {
    title: "FounderBacon — Companion Save the World",
    description: "Companion pour Fortnite: Save the World. Stats des armes, calculateur de dégâts, loadouts de héros, planner de perks, partage de builds — et une API REST ouverte pour les développeurs.",
    ogTitle: "FounderBacon — Companion Save the World",
    ogDescription: "Calculateur de build, stats d'armes, loadouts de héros, planner de perks et builds partageables pour Fortnite: Save the World. Avec une API REST ouverte.",
    ogImageAlt: "FounderBacon — Companion Save the World",
    twitterTitle: "FounderBacon — Companion Save the World",
    twitterDescription: "Stats d'armes, calculateur de build, loadouts de héros, builds partageables. Plus une API REST ouverte.",
    ogLocale: "fr_FR",
    keywords: [
      "Fortnite Save the World",
      "STW companion FR",
      "Save the World français",
      "calculateur de build STW",
      "calculateur d'armes STW",
      "calculateur de dégâts STW",
      "loadout héros STW",
      "planner de perks STW",
      "partage de builds STW",
      "outils Save the World",
      "Fortnite STW",
      "API STW",
      "stats armes Fortnite",
      "recettes de craft",
      "schémas Fortnite",
    ],
  },
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  const seo = SEO[locale]

  return {
    metadataBase: new URL(DOMAIN),
    title: {
      default: seo.title,
      template: "%s | FBCN",
    },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: "FounderBacon" }],
    creator: "FounderBacon",
    openGraph: {
      type: "website",
      locale: seo.ogLocale,
      url: `${DOMAIN}/${locale}`,
      siteName: "FounderBacon",
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: [{ url: "/opengraph_image.png", width: 1200, height: 630, alt: seo.ogImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@FounderBacon",
      creator: "@FounderBacon",
      title: seo.twitterTitle,
      description: seo.twitterDescription,
      images: ["/opengraph_image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
    },
    alternates: {
      canonical: `${DOMAIN}/${locale}`,
      languages: {
        en: `${DOMAIN}/en`,
        fr: `${DOMAIN}/fr`,
      },
    },
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params

  if (!isValidLocale(locale)) notFound()

  return children
}
