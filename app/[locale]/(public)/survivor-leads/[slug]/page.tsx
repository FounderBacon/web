import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SectionContainer } from "@/components/public/SectionContainer"
import { SurvivorLeadViewTracker } from "@/components/public/SurvivorLeadViewTracker"
import { AssetImage } from "@/components/ui/asset-image"
import { fetchSurvivorLead } from "@/lib/api/survivor-leads"
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
  const alternates = pageAlternates(locale, `/survivor-leads/${slug}`)
  try {
    const lead = await fetchSurvivorLead(slug)
    return {
      title: lead.name,
      description: lead.description || `${lead.name}, a ${lead.rarity} lead survivor for the ${lead.squadType} squad.`,
      alternates,
    }
  } catch {
    return { title: "Survivor lead", alternates }
  }
}

export default async function SurvivorLeadDetailPage({ params }: PageProps) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) return null

  let lead
  try {
    lead = await fetchSurvivorLead(slug)
  } catch {
    notFound()
  }

  const rarityClass = RARITY_TEXT[lead.rarity] ?? "text-muted-foreground"
  const accent = RARITY_BORDER[lead.rarity] ?? "border-l-border"

  const leadUrl = `/${locale}/survivor-leads/${slug}`

  return (
    <>
      <JsonLd
        data={[
          thingPageSchema({
            name: lead.name,
            description: lead.description || `${lead.name}, a ${lead.rarity} lead survivor for the ${lead.squadType} squad in Fortnite: Save the World.`,
            url: leadUrl,
            image: lead.iconUrlLarge ?? lead.iconUrl ?? undefined,
            category: "SurvivorLead",
          }),
          breadcrumbSchema([
            { name: "Home", url: `/${locale}` },
            { name: "Survivors", url: `/${locale}/search/survivors` },
            { name: lead.name, url: leadUrl },
          ]),
        ]}
      />
      <SurvivorLeadViewTracker slug={slug} />

      <div className="border-b border-border/50 bg-background px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden border border-border/50 bg-muted/30 sm:size-12">
              <AssetImage
                src={lead.iconUrlLarge ?? lead.iconUrl}
                alt={lead.name}
                className="absolute inset-0 size-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold uppercase leading-tight text-foreground sm:text-xl">{lead.name}</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                <span className={`font-medium capitalize ${rarityClass}`}>{lead.rarity}</span>
                {" / "}
                <span className="capitalize">{lead.squadType.replace("-", " ")}</span>
                {" / "}
                <span>Tier {lead.tier}</span>
              </p>
            </div>
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
        {/* Description */}
        {lead.description && (
          <p className="mb-8 max-w-prose text-base italic leading-relaxed text-muted-foreground">
            &ldquo;{lead.description}&rdquo;
          </p>
        )}

        {/* Personality bonus */}
        {(lead.matchingPersonalityBonus !== 0 || lead.mismatchingPersonalityPenalty !== 0) && lead.personality && (
          <div className="mb-8 flex flex-col gap-3 border border-border/50 bg-card/40 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Personality</p>
            <p className="font-burbank text-xl uppercase text-foreground">{lead.personality}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-muted-foreground">
                Match bonus: <span className="font-semibold text-uncommon">+{lead.matchingPersonalityBonus}</span>
              </span>
              <span className="text-muted-foreground">
                Mismatch: <span className="font-semibold text-malus">{lead.mismatchingPersonalityPenalty}</span>
              </span>
            </div>
          </div>
        )}

        {/* Info card */}
        <div className={`flex flex-col gap-2 border border-border/50 border-l-4 ${accent} bg-card/40 p-6`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Lead info</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2 sm:grid-cols-3">
            <InfoBlock label="Squad" value={lead.squadType.replace("-", " ")} />
            <InfoBlock label="Rarity" value={lead.rarity} valueClass={`capitalize ${rarityClass}`} />
            <InfoBlock label="Tier" value={`${lead.tier} / ${lead.maxTier}`} />
            <InfoBlock label="Level min" value={String(lead.levelRange.min)} />
            <InfoBlock label="Level max" value={String(lead.levelRange.max)} />
            {lead.gender && <InfoBlock label="Gender" value={lead.gender} />}
          </dl>
          <div className="flex flex-wrap gap-2 pt-3">
            {lead.isNamed && (
              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Named
              </span>
            )}
            {lead.isUnique && (
              <span className="rounded-md bg-mythic/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mythic">
                Unique
              </span>
            )}
          </div>
        </div>

        {lead.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {lead.tags.map((t) => (
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
      <dd className={`font-burbank text-xl uppercase text-foreground ${valueClass}`}>{value}</dd>
    </div>
  )
}
