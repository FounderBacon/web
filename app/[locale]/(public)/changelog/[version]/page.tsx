import type { Metadata } from "next"
import { AlertTriangle, ArrowLeft, Code2, Layers } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { fetchChangelogBySlug, type ChangelogCategory, type ChangelogItem } from "@/lib/api/changelog"
import { RARITY_DECO } from "@/lib/constants"
import { isValidLocale, type Locale } from "@/lib/i18n"
import { articleSchema, breadcrumbSchema } from "@/lib/jsonld"
import { pageAlternates } from "@/lib/seo"
import { JsonLd } from "@/components/common/JsonLd"

export const dynamic = "force-dynamic"

const CATEGORY_LABEL: Record<ChangelogCategory, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  deprecated: "Deprecated",
  removed: "Removed",
  security: "Security",
}

const CATEGORY_ACCENT: Record<ChangelogCategory, { text: string; bg: string; border: string; dot: string }> = {
  added: { text: "text-uncommon", bg: "bg-uncommon/10", border: "border-l-uncommon", dot: "bg-uncommon" },
  changed: { text: "text-rare", bg: "bg-rare/10", border: "border-l-rare", dot: "bg-rare" },
  fixed: { text: "text-epic", bg: "bg-epic/10", border: "border-l-epic", dot: "bg-epic" },
  deprecated: { text: "text-legendary", bg: "bg-legendary/10", border: "border-l-legendary", dot: "bg-legendary" },
  removed: { text: "text-malus", bg: "bg-malus/10", border: "border-l-malus", dot: "bg-malus" },
  security: { text: "text-mythic", bg: "bg-mythic/10", border: "border-l-mythic", dot: "bg-mythic" },
}

const ORDER: ChangelogCategory[] = ["added", "changed", "fixed", "deprecated", "removed", "security"]

// Scopes principaux (web d'abord, puis api). D'autres scopes sont possibles, on les met en dernier.
const SCOPE_ORDER = ["web", "api"]
const SCOPE_META: Record<string, { label: string; icon: LucideIcon; description: string; accent: string }> = {
  api: {
    label: "API",
    icon: Code2,
    description: "Backend, endpoints, data layer",
    accent: "text-rare",
  },
  web: {
    label: "Web",
    icon: Layers,
    description: "Frontend, UI, pages",
    accent: "text-epic",
  },
}

function scopeMeta(scope: string) {
  return (
    SCOPE_META[scope] ?? {
      label: scope.charAt(0).toUpperCase() + scope.slice(1),
      icon: Layers,
      description: "",
      accent: "text-foreground",
    }
  )
}

function formatLongDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; version: string }> }): Promise<Metadata> {
  const { locale: raw, version: slug } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  const alternates = pageAlternates(locale, `/changelog/${slug}`)
  try {
    const entry = await fetchChangelogBySlug(slug)
    return {
      title: `v${entry.version} — ${entry.title}`,
      description: entry.summary,
      alternates,
    }
  } catch {
    return { title: `Changelog — ${slug}`, alternates }
  }
}

interface PageProps {
  params: Promise<{ locale: string; version: string }>
}

export default async function ChangelogVersionPage({ params }: PageProps) {
  const { locale, version: slug } = await params
  if (!isValidLocale(locale)) return null

  let entry
  try {
    entry = await fetchChangelogBySlug(slug)
  } catch {
    notFound()
  }

  // Group : scope -> category -> items
  const byScope = new Map<string, Map<ChangelogCategory, ChangelogItem[]>>()
  for (const it of entry.items) {
    if (!byScope.has(it.scope)) byScope.set(it.scope, new Map())
    const byCat = byScope.get(it.scope)!
    if (!byCat.has(it.category)) byCat.set(it.category, [])
    byCat.get(it.category)!.push(it)
  }

  const orderedScopes = [
    ...SCOPE_ORDER.filter((s) => byScope.has(s)),
    ...Array.from(byScope.keys()).filter((s) => !SCOPE_ORDER.includes(s)).sort(),
  ]

  const scopeSections = orderedScopes.map((scope) => {
    const byCat = byScope.get(scope)!
    const total = Array.from(byCat.values()).reduce((acc, arr) => acc + arr.length, 0)
    const cats = ORDER.filter((c) => byCat.has(c)).map((c) => ({ category: c, items: byCat.get(c)! }))
    return { scope, total, cats }
  })

  const totalItems = entry.items.length
  const versionColor = (entry.rarity && RARITY_DECO[entry.rarity]) ?? "text-primary"
  const entryUrl = `/${locale}/changelog/${slug}`

  return (
    <>
      <JsonLd
        data={[
          articleSchema({
            title: `v${entry.version} — ${entry.title}`,
            description: entry.summary,
            url: entryUrl,
            datePublished: entry.releaseDate,
            dateModified: entry.updatedAt,
          }),
          breadcrumbSchema([
            { name: "Home", url: `/${locale}` },
            { name: "Changelog", url: `/${locale}/changelog` },
            { name: `v${entry.version}`, url: entryUrl },
          ]),
        ]}
      />
      <article className="mx-auto max-w-5xl px-6 py-12 md:py-20">
      <Link href={`/${locale}/changelog`} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to changelog
      </Link>

      {/* Hero header */}
      <header className="mb-10 border-b border-border/50 pb-10">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">{formatLongDate(entry.releaseDate, locale)}</p>
        <h1 className={`mb-3 font-burbank text-6xl uppercase leading-none md:text-8xl ${versionColor}`}>v{entry.version}</h1>
        <p className="font-burbank text-2xl uppercase text-foreground md:text-3xl">{entry.title}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {entry.breaking && (
            <span className="inline-flex items-center gap-1.5 border border-malus/40 bg-malus/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-malus">
              <AlertTriangle className="size-3" />
              Breaking
            </span>
          )}
          {entry.scope.map((s) => {
            const meta = scopeMeta(s)
            const Icon = meta.icon
            return (
              <span key={s} className="inline-flex items-center gap-1.5 border border-border/50 bg-muted/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Icon className="size-3" />
                {meta.label}
              </span>
            )
          })}
          <span className="inline-flex items-center gap-1.5 border border-border/50 bg-muted/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <span className="font-bold tabular-nums text-foreground">{totalItems}</span> updates
          </span>
        </div>
      </header>

      {/* Summary */}
      <p className="mb-10 text-base leading-relaxed text-foreground md:text-lg">{entry.summary}</p>

      {/* Migration notes */}
      {entry.migrationNotes && (
        <aside className="mb-10 flex gap-4 border-l-4 border-l-malus bg-malus/5 p-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-malus" />
          <div>
            <h2 className="mb-1.5 font-burbank text-base uppercase tracking-wide text-malus">Migration notes</h2>
            <p className="text-sm leading-relaxed text-foreground">{entry.migrationNotes}</p>
          </div>
        </aside>
      )}

      {/* Sticky scope nav */}
      <nav className="sticky top-[var(--navbar-h,4.75rem)] z-10 -mx-2 mb-12 flex flex-wrap gap-2 border-b border-border/50 bg-background/85 px-2 py-3 backdrop-blur-md">
        {scopeSections.map(({ scope, total }) => {
          const meta = scopeMeta(scope)
          const Icon = meta.icon
          return (
            <a
              key={scope}
              href={`#scope-${scope}`}
              className={`inline-flex items-center gap-2 border border-border/50 bg-card/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:bg-card ${meta.accent}`}
            >
              <Icon className="size-3.5" />
              {meta.label}
              <span className="text-muted-foreground tabular-nums">{total}</span>
            </a>
          )
        })}
      </nav>

      {/* Sections par scope */}
      <div className="flex flex-col gap-16">
        {scopeSections.map(({ scope, total, cats }) => {
          const meta = scopeMeta(scope)
          const Icon = meta.icon
          return (
            <section key={scope} id={`scope-${scope}`} style={{ scrollMarginTop: "8rem" }}>
              {/* Scope header (gros bandeau) */}
              <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-5">
                <div className="flex items-center gap-4">
                  <div className={`flex size-12 items-center justify-center border border-border/50 bg-card ${meta.accent}`}>
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <h2 className={`font-burbank text-3xl uppercase leading-none tracking-wide md:text-4xl ${meta.accent}`}>{meta.label}</h2>
                    {meta.description && (
                      <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">{meta.description}</p>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 border border-border/50 bg-muted/30 px-3 py-1.5 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  <span className="font-bold tabular-nums text-foreground">{total}</span> {total === 1 ? "item" : "items"}
                </span>
              </header>

              {/* Sous-sections par categorie */}
              <div className="flex flex-col gap-10">
                {cats.map(({ category, items }) => {
                  const accent = CATEGORY_ACCENT[category]
                  return (
                    <div key={category}>
                      <h3 className={`mb-4 flex items-center gap-2 font-burbank text-lg uppercase tracking-wide ${accent.text}`}>
                        <span className={`size-1.5 rounded-full ${accent.dot}`} />
                        {CATEGORY_LABEL[category]}
                        <span className="text-xs text-muted-foreground tabular-nums">{items.length}</span>
                      </h3>

                      <ul className="flex flex-col gap-3">
                        {items.map((it, i) => (
                          <li
                            key={`${scope}-${category}-${i}`}
                            className={`border border-border/40 border-l-2 ${accent.border} bg-card/30 p-4 transition-colors hover:bg-card/60`}
                          >
                            <h4 className="mb-1.5 text-base font-semibold text-foreground">{it.title}</h4>
                            {it.description && (
                              <p className="text-sm leading-relaxed text-muted-foreground">{it.description}</p>
                            )}
                            {it.endpoints.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {it.endpoints.map((ep) => (
                                  <code
                                    key={ep}
                                    className="inline-block border border-border/40 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-foreground"
                                  >
                                    {ep}
                                  </code>
                                ))}
                              </div>
                            )}
                            {it.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {it.tags.map((t) => (
                                  <span key={t} className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Footer tags */}
      {entry.tags.length > 0 && (
        <footer className="mt-14 flex flex-wrap gap-2 border-t border-border/50 pt-6">
          {entry.tags.map((t) => (
            <span key={t} className="inline-block border border-border/50 bg-muted/30 px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              #{t}
            </span>
          ))}
        </footer>
      )}
    </article>
    </>
  )
}
