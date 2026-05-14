import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { SectionContainer } from "@/components/public/SectionContainer"
import { SurvivorsTabs } from "@/components/public/SurvivorsTabs"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n"
import { pageAlternates } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  return {
    title: "Survivors — FounderBacon",
    description: "Browse all survivors from Fortnite Save the World with their rarities, tiers and level ranges.",
    alternates: pageAlternates(locale, "/search/survivors"),
  }
}

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function SearchSurvivorsPage({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)

  return (
    <SectionContainer className="relative mx-auto max-w-7xl overflow-hidden px-4 py-10 md:px-10 md:py-16">
      <FbcnLogo className="pointer-events-none absolute -right-20 -top-20 z-0 size-80 opacity-[0.03] md:size-125" />

      <div className="relative z-10 mb-10 flex flex-col gap-3 border-b border-border/50 pb-8 md:mb-14">
        <Link
          href={`/${locale}/search`}
          className="flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3" />
          {dict.search.backToHub}
        </Link>
        <h1 className="font-burbank text-5xl uppercase leading-none text-foreground md:text-7xl">Survivors</h1>
        <p className="text-sm text-muted-foreground">{dict.search.subtitle}</p>
      </div>

      <div className="relative z-10">
        <SurvivorsTabs locale={locale as Locale} />
      </div>
    </SectionContainer>
  )
}
