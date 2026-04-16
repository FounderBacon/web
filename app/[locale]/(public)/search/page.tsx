import type { Metadata } from "next"
import { getDictionary, isValidLocale } from "@/lib/i18n"
import { SectionContainer } from "@/components/public/SectionContainer"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { SearchHubGrid } from "@/components/public/SearchHubGrid"
import { fetchCounters, type ItemCounters } from "@/lib/api/weapons"

export const metadata: Metadata = {
  title: "Search",
  description: "Browse weapons, heroes, traps and survivors from Fortnite: Save the World.",
}

export const dynamic = "force-dynamic"

export default async function SearchHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) return null

  const dict = await getDictionary(locale)

  // Fetch compteurs cote serveur (fallback silencieux si API down)
  let counters: ItemCounters | null = null
  console.log("[search] API_URL =", process.env.NEXT_PUBLIC_API_URL)
  try {
    counters = await fetchCounters()
    console.log("[search] counters OK", counters)
  } catch (e) {
    const err = e as { status?: number; message?: string; response?: { data?: unknown; headers?: unknown } }
    console.log("[search] counters FAIL", {
      status: err.status,
      message: err.message,
      data: err.response?.data,
      headers: err.response?.headers,
    })
  }

  return (
    <SectionContainer className="relative mx-auto max-w-6xl px-4 py-16 md:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <FbcnLogo className="absolute right-0 top-0 size-64 opacity-[0.03] md:size-96" />
      </div>

      <div className="mb-14 flex flex-col gap-2">
        <h1 className="font-burbank text-4xl uppercase leading-none text-foreground md:text-6xl">{dict.search.hubTitle}</h1>
        <p className="max-w-lg font-sans text-base text-muted-foreground md:text-lg">{dict.search.hubSubtitle}</p>
      </div>

      <SearchHubGrid dict={dict} locale={locale} counters={counters} />
    </SectionContainer>
  )
}
