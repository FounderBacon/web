import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SectionContainer } from "@/components/public/SectionContainer"
import { SurvivorViewTracker } from "@/components/public/SurvivorViewTracker"
import { fetchSurvivor } from "@/lib/api/survivors"
import { RARITY_BORDER, RARITY_TEXT } from "@/lib/constants"
import { isValidLocale, type Locale } from "@/lib/i18n"
import { breadcrumbSchema, thingPageSchema } from "@/lib/jsonld"
import { pageAlternates } from "@/lib/seo"
import { JsonLd } from "@/components/common/JsonLd"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  const alternates = pageAlternates(locale, `/survivors/${slug}`)
  try {
    const s = await fetchSurvivor(slug)
    return {
      title: s.name,
      description: `${s.name}, a tier ${s.tier} ${s.rarity} survivor from Fortnite Save the World.`,
      alternates,
    }
  } catch {
    return { title: "Survivor", alternates }
  }
}

export default async function SurvivorDetailPage({ params }: PageProps) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) return null

  let survivor
  try {
    survivor = await fetchSurvivor(slug)
  } catch {
    notFound()
  }

  const rarityClass = RARITY_TEXT[survivor.rarity] ?? "text-muted-foreground"
  const accent = RARITY_BORDER[survivor.rarity] ?? "border-l-border"

  const survivorUrl = `/${locale}/survivors/${slug}`

  return (
    <>
      <JsonLd
        data={[
          thingPageSchema({
            name: survivor.name,
            description: `${survivor.name}, a tier ${survivor.tier} ${survivor.rarity} survivor from Fortnite: Save the World.`,
            url: survivorUrl,
            category: "Survivor",
          }),
          breadcrumbSchema([
            { name: "Home", url: `/${locale}` },
            { name: "Survivors", url: `/${locale}/search/survivors` },
            { name: survivor.name, url: survivorUrl },
          ]),
        ]}
      />
      <SurvivorViewTracker slug={slug} />

      <div className="border-b border-border/50 bg-background px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold uppercase leading-tight text-foreground sm:text-xl">{survivor.name}</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              <span className={`font-medium capitalize ${rarityClass}`}>{survivor.rarity}</span>
              {" / "}
              <span>Tier {survivor.tier}</span>
            </p>
          </div>

          <Link
            href={`/${locale}/search/survivors`}
            className="flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3" />
            Survivors
          </Link>
        </div>
      </div>

      <SectionContainer className="mx-auto max-w-3xl px-4 py-10 md:px-10 md:py-14">
        <div className={`flex flex-col gap-2 border border-border/50 border-l-4 ${accent} bg-card/40 p-6`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Survivor info</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2 sm:grid-cols-4">
            <InfoBlock label="Rarity" value={survivor.rarity} valueClass={`capitalize ${rarityClass}`} />
            <InfoBlock label="Tier" value={`${survivor.tier} / ${survivor.maxTier}`} />
            <InfoBlock label="Level min" value={String(survivor.levelRange.min)} />
            <InfoBlock label="Level max" value={String(survivor.levelRange.max)} />
          </dl>
        </div>

        {survivor.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {survivor.tags.map((t) => (
              <span
                key={t}
                className="rounded-md border border-border/50 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </SectionContainer>
    </>
  )
}

function InfoBlock({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className={`font-burbank text-xl uppercase text-foreground md:text-2xl ${valueClass}`}>{value}</dd>
    </div>
  )
}
