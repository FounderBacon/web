"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import type { Locale } from "@/lib/i18n"
import type en from "@/lang/en.json"
import type { ItemCounters } from "@/lib/api/weapons"

interface HubCategory {
  key: "weapons" | "heroes" | "traps" | "survivors"
  href: string | null
  count: string | null
  version: string
  available: boolean
}

// Formate un nombre style "1,247" / "523"
function formatCount(n: number | undefined): string | null {
  if (typeof n !== "number" || n <= 0) return null
  return n.toLocaleString("en-US")
}

function buildCategories(locale: Locale, counters: ItemCounters | null): HubCategory[] {
  const weaponsTotal = counters ? counters.ranged + counters.melee : undefined
  return [
    { key: "weapons",   href: `/${locale}/search/weapons`, count: formatCount(weaponsTotal),     version: "v0.2.0", available: true  },
    { key: "traps",     href: `/${locale}/search/traps`,   count: formatCount(counters?.trap),   version: "v0.2.0", available: true  },
    { key: "heroes",    href: null,                        count: null,                          version: "v0.3.0", available: false },
    { key: "survivors", href: null,                        count: null,                          version: "v0.4.0", available: false },
  ]
}

interface SearchHubGridProps {
  dict: typeof en
  locale: Locale
  counters: ItemCounters | null
}

export function SearchHubGrid({ dict, locale, counters }: SearchHubGridProps) {
  const categories = buildCategories(locale, counters)

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      {categories.map((cat) => {
        const info = dict.search.hubCategories[cat.key]
        return (
          <HubCard
            key={cat.key}
            cat={cat}
            title={info.title}
            subtitle={info.subtitle}
            topics={info.topics}
            availableLabel={dict.search.available}
            comingSoonLabel={dict.search.comingSoon}
            itemsLabel={dict.search.items}
            browseLabel={dict.search.browse}
            plannedLabel={dict.search.planned}
          />
        )
      })}
    </motion.div>
  )
}

interface HubCardProps {
  cat: HubCategory
  title: string
  subtitle: string
  topics: readonly string[]
  availableLabel: string
  comingSoonLabel: string
  itemsLabel: string
  browseLabel: string
  plannedLabel: string
}

function HubCard({ cat, title, subtitle, topics, availableLabel, comingSoonLabel, itemsLabel, browseLabel, plannedLabel }: HubCardProps) {
  const content = (
    <>
      {/* Header (pattern perk builder) : titre + status */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {cat.available ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-uncommon">
            <span className="size-1.5 rounded-full bg-uncommon" />
            {availableLabel}
          </span>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground">
            {comingSoonLabel}
          </span>
        )}
      </div>

      {/* Hero : CardFrame en filigrane (etire en largeur) + compteur burbank XXL */}
      <div className="relative flex aspect-2/1 items-center justify-center overflow-hidden border-b border-border bg-background">
        {/* CardFrame tourne 90deg : viewBox swappe + rotation SVG + remplissage */}
        <svg
          className="pointer-events-none absolute inset-0 size-full text-primary opacity-10 transition-opacity duration-300 group-hover:opacity-20"
          viewBox="0 0 400 250"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M69.1469 0H78.8493L29.9156 47.2464L69.1469 0ZM0 89.7096L112.373 0H113.204L73.0846 38.6761L125.307 0H250V287.625L86.4708 400H0V301.591L43.2585 264.339L0 285.347V89.7096ZM127.668 400H161.282L250 315.14V314.666L127.668 400Z"
            fill="currentColor"
            transform="translate(0 250) rotate(-90)"
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center text-center">
          {cat.available ? (
            <>
              <span className="font-burbank text-6xl uppercase leading-none text-foreground md:text-7xl">{cat.count ?? "—"}</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{itemsLabel}</span>
            </>
          ) : (
            <>
              <span className="font-burbank text-5xl uppercase leading-none text-muted-foreground md:text-6xl">{plannedLabel}</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{cat.version}</span>
            </>
          )}
        </div>
      </div>

      {/* Corps : description + topics */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

        {/* Topics : pattern boutons tier (rounded-md, border-border, bg-muted/60) */}
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <span
              key={t}
              className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-foreground/70 transition-colors group-hover:bg-muted group-hover:text-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Footer : action */}
      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
          {cat.available ? browseLabel : comingSoonLabel}
        </span>
        {cat.available && (
          <span className="text-base text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground">
            &rarr;
          </span>
        )}
      </div>
    </>
  )

  // Pattern container perk builder : rounded-lg + border pleine + bg-card
  const base = "group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-200"

  if (cat.href) {
    return (
      <motion.div variants={activeVariants} className="h-full">
        <Link
          href={cat.href}
          className={`${base} cursor-pointer hover:-translate-y-0.5 hover:border-primary hover:shadow-lg`}
        >
          {content}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={disabledVariants}
      className={`${base} cursor-not-allowed`}
      aria-disabled="true"
    >
      {content}
    </motion.div>
  )
}

const activeVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const disabledVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 0.5, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}
