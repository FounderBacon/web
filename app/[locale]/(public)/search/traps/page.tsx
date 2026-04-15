import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getDictionary, isValidLocale } from "@/lib/i18n"
import { SearchTrapsView } from "@/components/public/SearchTrapsView"
import { SectionContainer } from "@/components/public/SectionContainer"
import { FbcnLogo } from "@/components/svg/FbcnLogo"

export const metadata: Metadata = {
  title: "Search Traps",
  description: "Search and browse all traps from Fortnite: Save the World.",
}

export default async function SearchTrapsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)

  return (
    <SectionContainer className="relative mx-auto max-w-7xl overflow-hidden px-4 py-10 md:px-10 md:py-16">
      {/* Logo en filigrane */}
      <FbcnLogo className="pointer-events-none absolute -right-20 -top-20 z-0 size-80 opacity-[0.03] md:size-125" />

      {/* Hero header */}
      <div className="relative z-10 mb-10 flex flex-col gap-3 border-b border-border/50 pb-8 md:mb-14">
        <Link
          href={`/${locale}/search`}
          className="flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3" />
          {dict.search.backToHub}
        </Link>
        <h1 className="font-burbank text-5xl uppercase leading-none text-foreground md:text-7xl">{dict.search.trapsTitle}</h1>
        <p className="text-sm text-muted-foreground">{dict.search.subtitle}</p>
      </div>

      <div className="relative z-10">
        <SearchTrapsView dict={dict} locale={locale} />
      </div>
    </SectionContainer>
  )
}
