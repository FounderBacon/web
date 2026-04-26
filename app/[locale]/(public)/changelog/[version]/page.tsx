// NOTE : ce dossier devrait etre renomme [version] -> [slug].
// Le param est encore appele "version" mais contient le slug (ex: "2026-04-19" ou "2026-04-19-1").
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { fetchChangelogBySlug, type ChangelogCategory, type ChangelogItem } from "@/lib/api/changelog"
import { isValidLocale, type Locale } from "@/lib/i18n"

export const dynamic = "force-dynamic"

const CATEGORY_LABEL: Record<ChangelogCategory, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  deprecated: "Deprecated",
  removed: "Removed",
  security: "Security",
}

const CATEGORY_CLASS: Record<ChangelogCategory, string> = {
  added: "border-l-uncommon",
  changed: "border-l-rare",
  fixed: "border-l-epic",
  deprecated: "border-l-legendary",
  removed: "border-l-malus",
  security: "border-l-mythic",
}

const CATEGORY_TEXT: Record<ChangelogCategory, string> = {
  added: "text-uncommon",
  changed: "text-rare",
  fixed: "text-epic",
  deprecated: "text-legendary",
  removed: "text-malus",
  security: "text-mythic",
}

const ORDER: ChangelogCategory[] = ["added", "changed", "fixed", "deprecated", "removed", "security"]

function formatLongDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; version: string }> }): Promise<Metadata> {
  const { version: slug } = await params
  try {
    const entry = await fetchChangelogBySlug(slug)
    return {
      title: `v${entry.version} — ${entry.title}`,
      description: entry.summary,
    }
  } catch {
    return { title: `Changelog — ${slug}` }
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

  // Groupe les items par categorie en respectant l'ordre defini
  const grouped = new Map<ChangelogCategory, ChangelogItem[]>()
  for (const it of entry.items) {
    const list = grouped.get(it.category) ?? []
    list.push(it)
    grouped.set(it.category, list)
  }
  const sections = ORDER.filter((c) => grouped.has(c)).map((c) => ({ category: c, items: grouped.get(c) ?? [] }))

  return (
    <article className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <Link
        href={`/${locale}/changelog`}
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to changelog
      </Link>

      <header className="mb-8 border-b border-border/50 pb-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {formatLongDate(entry.releaseDate, locale)}
        </p>
        <h1 className="mb-3 font-burbank text-6xl uppercase leading-none text-primary md:text-8xl">
          v{entry.version}
        </h1>
        <p className="font-burbank text-2xl uppercase text-primary-foreground md:text-3xl">{entry.title}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {entry.breaking && (
            <span className="rounded bg-malus/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-malus">
              Breaking change
            </span>
          )}
          {entry.scope.map((s) => (
            <span
              key={s}
              className="rounded-md border border-border/50 bg-muted/30 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      </header>

      <p className="mb-10 text-lg leading-relaxed text-foreground">{entry.summary}</p>

      {entry.migrationNotes && (
        <aside className="mb-10 border-l-4 border-l-malus bg-malus/5 p-5">
          <h2 className="mb-2 font-burbank text-lg uppercase text-malus">Migration notes</h2>
          <p className="text-sm leading-relaxed text-foreground">{entry.migrationNotes}</p>
        </aside>
      )}

      <div className="flex flex-col gap-12">
        {sections.map(({ category, items }) => (
          <section key={category}>
            <h2 className={`mb-5 font-burbank text-2xl uppercase ${CATEGORY_TEXT[category]}`}>
              {CATEGORY_LABEL[category]}
              <span className="ml-2 text-base text-muted-foreground">({items.length})</span>
            </h2>
            <ul className="flex flex-col gap-4">
              {items.map((it, i) => (
                <li key={i} className={`border-l-2 pl-4 ${CATEGORY_CLASS[category]}`}>
                  <h3 className="mb-1 text-base font-semibold text-foreground">{it.title}</h3>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{it.description}</p>
                  {it.endpoints.length > 0 && (
                    <ul className="mb-2 flex flex-col gap-1">
                      {it.endpoints.map((ep) => (
                        <li key={ep}>
                          <code className="inline-block bg-muted/40 px-2 py-0.5 font-mono text-xs text-foreground">
                            {ep}
                          </code>
                        </li>
                      ))}
                    </ul>
                  )}
                  {it.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {it.tags.map((t) => (
                        <span key={t} className="text-[11px] text-muted-foreground">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {entry.tags.length > 0 && (
        <footer className="mt-12 flex flex-wrap gap-2 border-t border-border/50 pt-6">
          {entry.tags.map((t) => (
            <span
              key={t}
              className="rounded-md border border-border/50 bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground"
            >
              #{t}
            </span>
          ))}
        </footer>
      )}
    </article>
  )
}
