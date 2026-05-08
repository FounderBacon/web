import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { Locale } from "@/lib/i18n"
import type en from "@/lang/en.json"
import type { ItemCounters } from "@/lib/api/weapons"
import { formatInt } from "@/lib/format"

type SearchTab = "weapons" | "traps" | "heroes"

interface SearchPageHeaderProps {
  locale: Locale
  active: SearchTab
  title: string
  subtitle: string
  dict: typeof en
  counters?: ItemCounters | null
}

const TABS: { key: SearchTab; href: (l: string) => string; labelKey: "weapons" | "traps" | "heroes" }[] = [
  { key: "weapons", href: (l) => `/${l}/search/weapons`, labelKey: "weapons" },
  { key: "traps", href: (l) => `/${l}/search/traps`, labelKey: "traps" },
  { key: "heroes", href: (l) => `/${l}/search/heroes`, labelKey: "heroes" },
]

function tabCount(key: SearchTab, c: ItemCounters | null | undefined): number | null {
  if (!c) return null
  if (key === "weapons") return (c.ranged ?? 0) + (c.melee ?? 0)
  if (key === "traps") return c.trap ?? null
  if (key === "heroes") return c.hero ?? null
  return null
}

export function SearchPageHeader({ locale, active, title, subtitle, dict, counters }: SearchPageHeaderProps) {
  return (
    <div className="relative z-10 mb-6 flex flex-col gap-3 md:mb-8">
      {/* Breadcrumb back, discret en haut */}
      <Link
        href={`/${locale}/search`}
        className="flex w-fit items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3" />
        {dict.search.backToHub}
      </Link>

      {/* Bandeau principal : titre/sous-titre a gauche, tabs avec compteur a droite */}
      <div className="flex flex-col items-stretch justify-between gap-4 border border-border/50 bg-card/40 px-4 py-4 backdrop-blur-sm md:flex-row md:items-center md:px-5">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-burbank text-3xl uppercase leading-none text-foreground md:text-4xl">{title}</h1>
          <p className="text-xs text-muted-foreground md:text-sm">{subtitle}</p>
        </div>

        <nav className="flex w-full items-center gap-1 border border-border/50 bg-background/40 p-1 md:w-fit">
          {TABS.map(({ key, href, labelKey }) => {
            const isActive = key === active
            const label = dict.search.hubCategories[labelKey].title
            const count = tabCount(key, counters)
            return (
              <Link
                key={key}
                href={href(locale)}
                className={`flex flex-1 items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors md:flex-none ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{label}</span>
                {count !== null && (
                  <span className={`tabular-nums text-[10px] font-bold ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
                    {formatInt(count)}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
