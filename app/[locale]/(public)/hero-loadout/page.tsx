import type { Metadata } from "next"
import { isValidLocale, type Locale } from "@/lib/i18n"
import { pageAlternates } from "@/lib/seo"
import { HeroLoadoutBuilder } from "@/components/loadout/HeroLoadoutBuilder"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  return {
    title: "Hero loadout builder",
    description:
      "Build your Save the World hero loadout: commander, support team, team perks. Visualize total bonuses, share the build, and save your presets.",
    alternates: pageAlternates(locale, "/hero-loadout"),
  }
}

export default async function HeroLoadoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  return <HeroLoadoutBuilder locale={locale} />
}
