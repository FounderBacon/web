import type { Metadata } from "next"
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n"
import { pageAlternates } from "@/lib/seo"
import { SearchPageHeader } from "@/components/public/SearchPageHeader"
import { SearchView } from "@/components/public/SearchView"
import { SectionContainer } from "@/components/public/SectionContainer"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { fetchCounters, type ItemCounters } from "@/lib/api/weapons"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  return {
    title: "Search Weapons",
    description: "Search and browse all weapons from Fortnite: Save the World.",
    alternates: pageAlternates(locale, "/search/weapons"),
  }
}

export const dynamic = "force-dynamic"

export default async function SearchWeaponsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)
  let counters: ItemCounters | null = null
  try { counters = await fetchCounters() } catch { /* fallback silencieux */ }

  return (
    <SectionContainer className="relative mx-auto max-w-7xl px-4 py-10 md:px-10 md:py-16">
      {/* Wrapper clipping local pour eviter que le logo deborde a droite (overflow horizontal mobile) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <FbcnLogo className="absolute -right-20 -top-20 z-0 size-80 opacity-[0.03] md:size-125" />
      </div>

      <SearchPageHeader
        locale={locale as Locale}
        active="weapons"
        title={dict.search.weaponsTitle}
        subtitle={dict.search.subtitle}
        dict={dict}
        counters={counters}
      />

      <div className="relative z-10">
        <SearchView dict={dict} locale={locale as Locale} />
      </div>
    </SectionContainer>
  )
}
