import type { Metadata } from "next"
import { HeroesView } from "@/components/public/HeroesView"
import { SearchPageHeader } from "@/components/public/SearchPageHeader"
import { SectionContainer } from "@/components/public/SectionContainer"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n"
import { fetchCounters, type ItemCounters } from "@/lib/api/weapons"

export const metadata: Metadata = {
  title: "Heroes — FounderBacon",
  description: "Browse all 396+ heroes from Fortnite Save the World with their classes, perks, and abilities.",
}

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function SearchHeroesPage({ params }: PageProps) {
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
        active="heroes"
        title="Heroes"
        subtitle={dict.search.subtitle}
        dict={dict}
        counters={counters}
      />

      <div className="relative z-10">
        <HeroesView locale={locale as Locale} />
      </div>
    </SectionContainer>
  )
}
