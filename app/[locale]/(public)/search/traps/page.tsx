import type { Metadata } from "next"
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n"
import { pageAlternates } from "@/lib/seo"
import { SearchPageHeader } from "@/components/public/SearchPageHeader"
import { SearchTrapsView } from "@/components/public/SearchTrapsView"
import { SectionContainer } from "@/components/public/SectionContainer"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { fetchCounters, type ItemCounters } from "@/lib/api/weapons"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  return {
    title: "Search Traps",
    description: "Search and browse all traps from Fortnite: Save the World.",
    alternates: pageAlternates(locale, "/search/traps"),
  }
}

export const dynamic = "force-dynamic"

export default async function SearchTrapsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)
  let counters: ItemCounters | null = null
  try { counters = await fetchCounters() } catch { /* fallback silencieux */ }

  return (
    <SectionContainer className="relative mx-auto max-w-7xl px-4 py-10 md:px-10 md:py-16">
      <FbcnLogo className="pointer-events-none absolute -right-20 -top-20 z-0 size-80 opacity-[0.03] md:size-125" />

      <SearchPageHeader
        locale={locale as Locale}
        active="traps"
        title={dict.search.trapsTitle}
        subtitle={dict.search.subtitle}
        dict={dict}
        counters={counters}
      />

      <div className="relative z-10">
        <SearchTrapsView dict={dict} locale={locale as Locale} />
      </div>
    </SectionContainer>
  )
}
