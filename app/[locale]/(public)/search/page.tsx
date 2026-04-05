import type { Metadata } from "next"
import { getDictionary, isValidLocale } from "@/lib/i18n"
import { SearchView } from "@/components/public/SearchView"
import { SectionContainer } from "@/components/public/SectionContainer"
import { FbcnLogo } from "@/components/svg/FbcnLogo"

export const metadata: Metadata = {
  title: "Search Weapons",
  description: "Search and browse all weapons from Fortnite: Save the World.",
}

export default async function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)

  return (
    <SectionContainer className="mx-auto max-w-7xl px-4 py-10 md:px-10">
      <FbcnLogo className="pointer-events-none absolute right-0 top-0 size-64 opacity-[0.03] md:size-96" />
      <h1 className="mb-2 font-burbank text-4xl uppercase text-foreground md:text-5xl">{dict.search.title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">Fortnite: Save the World</p>
      <SearchView dict={dict} locale={locale} />
    </SectionContainer>
  )
}
