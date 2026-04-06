import type { Metadata } from "next"
import { locales, isValidLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

const DOMAIN = "https://founderbacon.com"

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: {
    default: "FounderBacon",
    template: "%s | FounderBacon",
  },
  description: "The first free, open REST API for Fortnite: Save the World. Every weapon, every stat, every perk, every crafting recipe — structured and ready to use.",
  keywords: ["Fortnite", "Save the World", "STW", "API", "REST", "weapons", "schematics", "perks", "crafting", "stats", "damage calculator", "builds", "game data"],
  authors: [{ name: "FounderBacon" }],
  creator: "FounderBacon",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: DOMAIN,
    siteName: "FounderBacon",
    title: "FounderBacon — Free REST API for Fortnite: Save the World",
    description: "Every weapon. Every stat. Every perk. One API. Comprehensive game data for players and developers.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FounderBacon — Free REST API for Fortnite: Save the World" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@FounderBacon",
    creator: "@FounderBacon",
    title: "FounderBacon — Free REST API for Fortnite: Save the World",
    description: "Every weapon. Every stat. Every perk. One API.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: {
    canonical: DOMAIN,
    languages: {
      en: `${DOMAIN}/en`,
      fr: `${DOMAIN}/fr`,
    },
  },
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params

  if (!isValidLocale(locale)) notFound()

  return children
}
