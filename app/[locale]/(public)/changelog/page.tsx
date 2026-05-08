import type { Metadata } from "next"
import { AlertTriangle, ArrowRight, Code2, Layers } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { entrySlug, fetchChangelog, type ChangelogCategory, type ChangelogEntry } from "@/lib/api/changelog"
import { RARITY_BORDER, RARITY_DECO } from "@/lib/constants"
import { isValidLocale, type Locale } from "@/lib/i18n"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Changelog",
  description: "FounderBacon changelog — every update, fix, and new feature.",
}

const CATEGORY_ACCENT: Record<ChangelogCategory, { text: string; bg: string; dot: string }> = {
  added: { text: "text-uncommon", bg: "bg-uncommon/10", dot: "bg-uncommon" },
  changed: { text: "text-rare", bg: "bg-rare/10", dot: "bg-rare" },
  fixed: { text: "text-epic", bg: "bg-epic/10", dot: "bg-epic" },
  deprecated: { text: "text-legendary", bg: "bg-legendary/10", dot: "bg-legendary" },
  removed: { text: "text-malus", bg: "bg-malus/10", dot: "bg-malus" },
  security: { text: "text-mythic", bg: "bg-mythic/10", dot: "bg-mythic" },
}

const ORDER: ChangelogCategory[] = ["added", "changed", "fixed", "deprecated", "removed", "security"]

function formatShortDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function categoryCounts(entry: ChangelogEntry): Array<{ category: ChangelogCategory; count: number }> {
  const counts = new Map<ChangelogCategory, number>()
  for (const it of entry.items) {
    counts.set(it.category, (counts.get(it.category) ?? 0) + 1)
  }
  return ORDER.filter((c) => counts.has(c)).map((c) => ({ category: c, count: counts.get(c)! }))
}

function scopeIcon(scope: string) {
  if (scope === "api") return <Code2 className="size-3" />
  if (scope === "web") return <Layers className="size-3" />
  return null
}

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function ChangelogPage({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  let entries: ChangelogEntry[] = []
  try {
    const res = await fetchChangelog({ limit: 50 })
    entries = res.data
  } catch {
    entries = []
  }

  const totalReleases = entries.length
  const totalUpdates = entries.reduce((acc, e) => acc + e.items.length, 0)

  return (
    <article className="mx-auto max-w-5xl px-6 py-12 md:py-20">
      {/* Hero header */}
      <header className="mb-12 border-b border-border/50 pb-10">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">FounderBacon</p>
        <h1 className="mb-4 font-burbank text-5xl uppercase text-foreground md:text-7xl">Changelog</h1>
        <p className="text-base text-muted-foreground md:text-lg">Every update, fix, and new feature shipped.</p>

        {totalReleases > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 border border-border/50 bg-muted/30 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="font-bold tabular-nums text-foreground">{totalReleases}</span> releases
            </span>
            <span className="inline-flex items-center gap-1.5 border border-border/50 bg-muted/30 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="font-bold tabular-nums text-foreground">{totalUpdates}</span> updates
            </span>
          </div>
        )}
      </header>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No releases yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {entries.map((entry) => {
            const versionColor = (entry.rarity && RARITY_DECO[entry.rarity]) ?? "text-primary"
            const borderColor = (entry.rarity && RARITY_BORDER[entry.rarity]) ?? "border-l-primary"
            const counts = categoryCounts(entry)
            return (
              <li key={entry._id}>
                <Link
                  href={`/${locale}/changelog/${entrySlug(entry)}`}
                  className={`group relative grid grid-cols-1 gap-5 border border-border/40 border-l-2 ${borderColor} bg-card/30 p-5 transition-colors hover:bg-card/60 md:grid-cols-[140px_1fr_auto] md:items-start md:gap-6`}
                >
                  {/* Date column (desktop) */}
                  <div className="hidden md:block">
                    <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">{formatShortDate(entry.releaseDate, locale)}</p>
                    <p className={`mt-1 font-burbank text-3xl uppercase leading-none ${versionColor}`}>v{entry.version}</p>
                  </div>

                  {/* Title + summary */}
                  <div className="min-w-0">
                    {/* Mobile : version + date inline */}
                    <div className="mb-2 flex flex-wrap items-baseline gap-2 md:hidden">
                      <span className={`font-burbank text-2xl uppercase ${versionColor}`}>v{entry.version}</span>
                      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{formatShortDate(entry.releaseDate, locale)}</span>
                    </div>
                    <h2 className="mb-1.5 text-lg font-semibold text-foreground">{entry.title}</h2>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{entry.summary}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {entry.breaking && (
                        <span className="inline-flex items-center gap-1 border border-malus/40 bg-malus/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-malus">
                          <AlertTriangle className="size-2.5" />
                          Breaking
                        </span>
                      )}
                      {entry.scope.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 border border-border/40 bg-muted/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          {scopeIcon(s)}
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Counts column (desktop) */}
                  <div className="flex flex-wrap gap-1.5 md:flex-col md:items-end md:gap-1">
                    {counts.map(({ category, count }) => {
                      const accent = CATEGORY_ACCENT[category]
                      return (
                        <span
                          key={category}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] ${accent.bg} ${accent.text}`}
                        >
                          <span className={`size-1.5 rounded-full ${accent.dot}`} />
                          <span className="tabular-nums">{count}</span>
                          <span className="hidden md:inline">{category}</span>
                        </span>
                      )
                    })}
                    <ArrowRight className="hidden size-4 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-foreground md:mt-2 md:block" />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
