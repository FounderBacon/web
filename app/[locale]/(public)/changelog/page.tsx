import type { Metadata } from "next"
import { SectionContainer } from "@/components/public/SectionContainer"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { isValidLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Changelog",
  description: "FounderBacon changelog — every update, fix, and new feature.",
}

interface ChangelogEntry {
  version: string
  date: string
  color: string
  changes: { type: "feat" | "fix" | "refactor" | "chore"; desc: string }[]
}

const TYPE_BADGE: Record<string, { label: string; class: string }> = {
  feat: { label: "feat", class: "bg-uncommon/10 text-uncommon" },
  fix: { label: "fix", class: "bg-malus/10 text-malus" },
  refactor: { label: "refactor", class: "bg-rare/10 text-rare" },
  chore: { label: "chore", class: "bg-muted text-muted-foreground" },
}

const ENTRIES: ChangelogEntry[] = [
  {
    version: "v0.2.1",
    date: "April 13, 2026",
    color: "text-epic",
    changes: [
      { type: "feat", desc: "Search hub page with category cards (weapons, traps, heroes, survivors) wired to live counters endpoint" },
      { type: "feat", desc: "Traps section: list view with filters, detail page with perk builder, tier selector and stats calculator" },
      { type: "feat", desc: "Landing page auto-unlock: countdown at 0 swaps to the full home automatically without manual refresh" },
      { type: "feat", desc: "Centralized Skeleton component with shimmer animation (weapon card, grid, detail, hub card, text)" },
      { type: "feat", desc: "AssetImage component with automatic fallback to unknown icon on missing images" },
      { type: "feat", desc: "API documentation link in navbar (api.founderbacon.com/docs)" },
      { type: "refactor", desc: "Search page split: hub at /search, weapons list at /search/weapons, traps list at /search/traps" },
      { type: "refactor", desc: "Design alignment between search hub and perk builder (consistent card styles, typography)" },
      { type: "fix", desc: "Defensive guards on partial API payloads (missing displayTier, levelRange, crafting, DPS fields on melee)" },
    ],
  },
  {
    version: "v0.2.0",
    date: "April 11, 2026",
    color: "text-legendary",
    changes: [
      { type: "feat", desc: "Ranged & melee weapons database with full stats, perks, and crafting recipes" },
      { type: "feat", desc: "Weapon search with filters (type, category, rarity, element)" },
      { type: "feat", desc: "Perk builder with real-time DPS calculator" },
      { type: "feat", desc: "Build screenshot export" },
      { type: "feat", desc: "Traps database" },
      { type: "feat", desc: "Homepage redesign with feature sections, carousel, and weapon slider" },
      { type: "feat", desc: "STW profile linking via Epic Games OAuth" },
      { type: "feat", desc: "Feature flags system with server-side fetch and client polling" },
      { type: "feat", desc: "FAQ and suggestions sections" },
      { type: "feat", desc: "Roadmap and changelog pages" },
      { type: "feat", desc: "Dark/light theme support across all pages" },
      { type: "fix", desc: "Navbar adapts when user is logged in" },
      { type: "refactor", desc: "Semantic color tokens for full theme compatibility" },
    ],
  },
  {
    version: "v0.1.0",
    date: "March 28, 2026",
    color: "text-common",
    changes: [
      { type: "feat", desc: "Initial API infrastructure and hosting" },
      { type: "feat", desc: "Website scaffolding with Next.js App Router" },
      { type: "feat", desc: "Landing page with animated pattern and countdown" },
      { type: "feat", desc: "Epic Games OAuth login flow" },
      { type: "feat", desc: "Internationalization (EN/FR)" },
      { type: "feat", desc: "SEO optimization with JSON-LD, OpenGraph, sitemap" },
      { type: "chore", desc: "Security headers, image proxy, PWA manifest" },
    ],
  },
]

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  return (
    <SectionContainer className="mx-auto max-w-3xl px-4 py-16 md:px-10">
      <FbcnLogo className="pointer-events-none absolute right-0 top-0 size-64 opacity-[0.03] md:size-96" />

      <h1 className="mb-2 font-burbank text-4xl uppercase text-foreground md:text-6xl">Changelog</h1>
      <p className="mb-14 text-base text-muted-foreground md:text-lg">
        Every update, fix, and new feature shipped.
      </p>

      <div className="flex flex-col gap-12">
        {ENTRIES.map((entry) => (
          <div key={entry.version}>
            {/* Header version */}
            <div className="mb-4 flex items-baseline gap-3">
              <span className={`font-burbank text-3xl uppercase md:text-4xl ${entry.color}`}>{entry.version}</span>
              <span className="text-sm text-muted-foreground">{entry.date}</span>
            </div>

            {/* Liste des changements */}
            <div className="flex flex-col gap-2 border-l-2 border-border/50 pl-5">
              {entry.changes.map((change, i) => {
                const badge = TYPE_BADGE[change.type]
                return (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 shrink-0 px-2 py-0.5 text-[11px] font-semibold ${badge.class}`}>{badge.label}</span>
                    <span className="text-sm text-foreground">{change.desc}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
