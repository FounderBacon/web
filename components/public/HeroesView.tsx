"use client"

import { RotateCcw, Search as SearchIcon, SlidersHorizontal, Sparkles, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AssetImage } from "@/components/ui/asset-image"
import {
  BOOST_SUGGESTIONS,
  BOOSTS_MAX_LENGTH,
  fetchHeroes,
  sanitizeBoostsInput,
  type HeroClass,
  type HeroSummary,
} from "@/lib/api/heroes"
import { RARITIES_VISIBLE, RARITY_BG, RARITY_BORDER, RARITY_DECO, RARITY_GRADIENT, RARITY_TEXT } from "@/lib/constants"
import { formatInt } from "@/lib/format"
import type { Locale } from "@/lib/i18n"

const HERO_CLASSES: HeroClass[] = ["soldier", "constructor", "ninja", "outlander"]

interface HeroesViewProps {
  locale: Locale
}

export function HeroesView({ locale }: HeroesViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Init depuis l'URL : permet aux deep links (?boosts=minigun&heroClass=soldier)
  // depuis la search globale ou un partage externe de pre-remplir les filtres.
  const [heroClass, setHeroClass] = useState<HeroClass | "">(() => {
    const c = searchParams.get("heroClass")
    return c && HERO_CLASSES.includes(c as HeroClass) ? (c as HeroClass) : ""
  })
  const [rarity, setRarity] = useState(() => searchParams.get("rarity") ?? "")
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "")
  const [boosts, setBoosts] = useState(() => sanitizeBoostsInput(searchParams.get("boosts") ?? ""))
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [debouncedBoosts, setDebouncedBoosts] = useState(boosts)
  const [page, setPage] = useState(1)
  const [heroes, setHeroes] = useState<HeroSummary[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  // Sync URL <- state : utilise replace pour ne pas polluer l'historique back/forward
  // a chaque keystroke. Les debounced values sont utilisees pour search/boosts.
  const syncUrl = useCallback(
    (next: { search?: string; boosts?: string; heroClass?: string; rarity?: string }) => {
      const params = new URLSearchParams()
      if (next.search) params.set("search", next.search)
      if (next.boosts) params.set("boosts", next.boosts)
      if (next.heroClass) params.set("heroClass", next.heroClass)
      if (next.rarity) params.set("rarity", next.rarity)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname],
  )

  useEffect(() => {
    syncUrl({
      search: debouncedSearch,
      boosts: debouncedBoosts,
      heroClass: heroClass || undefined,
      rarity: rarity || undefined,
    })
  }, [debouncedSearch, debouncedBoosts, heroClass, rarity, syncUrl])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Debounce boosts (separe pour pas refetch sur chaque keystroke)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBoosts(boosts), 300)
    return () => clearTimeout(t)
  }, [boosts])

  // Reset page quand un filtre change
  useEffect(() => {
    setPage(1)
  }, [heroClass, rarity, debouncedSearch, debouncedBoosts])

  // Fetch
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchHeroes({
      search: debouncedSearch || undefined,
      boosts: debouncedBoosts || undefined,
      heroClass: heroClass || undefined,
      rarity: rarity || undefined,
      page,
      limit: 24,
    })
      .then((res) => {
        if (cancelled) return
        setHeroes(res.data)
        setTotal(res.pagination.total)
        setTotalPages(res.pagination.totalPages)
      })
      .catch(() => {
        if (cancelled) return
        setHeroes([])
        setTotal(0)
        setTotalPages(1)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, debouncedBoosts, heroClass, rarity, page])

  const activeFilters = useMemo(
    () => [heroClass, rarity, search, boosts].filter(Boolean).length,
    [heroClass, rarity, search, boosts],
  )
  const hasFilter = activeFilters > 0

  function resetAll() {
    setSearch("")
    setBoosts("")
    setHeroClass("")
    setRarity("")
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
      {/* Sidebar filtres : sticky sous la navbar sur desktop */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="overflow-hidden border border-border/50 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border/50 bg-card px-4 py-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Filters</p>
              {hasFilter && (
                <span className="bg-primary/20 px-1.5 text-[11px] font-semibold tabular-nums text-primary">{activeFilters}</span>
              )}
            </div>
            {hasFilter && (
              <button
                type="button"
                onClick={resetAll}
                className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4 p-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search heroes..."
                className="w-full border border-border/50 bg-background/60 px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <Sparkles className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={boosts}
                  onChange={(e) => setBoosts(sanitizeBoostsInput(e.target.value))}
                  maxLength={BOOSTS_MAX_LENGTH}
                  placeholder="Boosts (e.g. minigun)..."
                  className="w-full border border-border/50 bg-background/60 px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none transition-colors"
                />
                {boosts && (
                  <button
                    type="button"
                    onClick={() => setBoosts("")}
                    aria-label="Clear boosts filter"
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <p className="px-1 text-[10px] leading-snug text-muted-foreground/70">
                Find heroes whose perks boost a specific weapon, stat or ability.
              </p>
              <div className="flex flex-wrap gap-1 px-1 pt-1">
                {BOOST_SUGGESTIONS.map((term) => {
                  const active = boosts === term
                  return (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setBoosts(active ? "" : term)}
                      className={`cursor-pointer border px-2 py-0.5 text-[10px] font-medium capitalize transition-colors ${
                        active
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                    >
                      {term}
                    </button>
                  )
                })}
              </div>
            </div>

            <FilterGroup label="Class">
              <FilterChip label="All" active={!heroClass} onClick={() => setHeroClass("")} />
              {HERO_CLASSES.map((c) => (
                <FilterChip key={c} label={c} active={heroClass === c} onClick={() => setHeroClass(heroClass === c ? "" : c)} />
              ))}
            </FilterGroup>

            <FilterGroup label="Rarity">
              <FilterChip label="All" active={!rarity} onClick={() => setRarity("")} />
              {RARITIES_VISIBLE.map((r) => (
                <FilterChip
                  key={r}
                  label={r}
                  active={rarity === r}
                  onClick={() => setRarity(rarity === r ? "" : r)}
                  dotClass={RARITY_BG[r]}
                  activeTextClass={RARITY_DECO[r]}
                />
              ))}
            </FilterGroup>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border border-border/50 bg-card/40 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-baseline gap-2">
            {loading && heroes.length === 0 ? (
              <span className="font-burbank text-2xl uppercase text-muted-foreground">...</span>
            ) : (
              <>
                <span className="font-burbank text-2xl uppercase text-foreground md:text-3xl">{formatInt(total)}</span>
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {total === 1 ? "hero" : "heroes"}
                </span>
              </>
            )}
          </div>
          {totalPages > 1 && !loading && (
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Page <span className="font-bold text-foreground">{page}</span> / {totalPages}
            </span>
          )}
        </div>

        {loading && heroes.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading heroes...</p>
        ) : heroes.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No heroes match your filters.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {heroes.map((h) => {
              const borderColor = RARITY_BORDER[h.rarity] ?? "border-l-border"
              const gradient = RARITY_GRADIENT[h.rarity] ?? "from-transparent"
              const rarityTextColor = RARITY_TEXT[h.rarity] ?? "text-muted-foreground"
              const rarityBgColor = RARITY_BG[h.rarity] ?? "bg-muted"
              return (
                <li key={h._id}>
                  <Link
                    href={`/${locale}/heroes/${h.slug}`}
                    className={`group relative flex h-full flex-col overflow-hidden border border-border/50 border-l-2 ${borderColor} bg-card/40 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-card hover:shadow-lg`}
                  >
                    <div className={`relative flex aspect-square items-center justify-center overflow-hidden bg-linear-to-br ${gradient} to-transparent`}>
                      <span className={`absolute right-2 top-2 size-2 rounded-full ${rarityBgColor} shadow-sm`} />
                      <AssetImage
                        src={h.iconUrl}
                        alt={h.name}
                        className="absolute inset-0 size-full object-contain p-2 drop-shadow-md transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 border-t border-border/50 bg-card px-3 py-2.5">
                      <p className="truncate text-sm font-semibold leading-tight text-foreground">{h.name}</p>
                      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span className={`font-semibold ${rarityTextColor}`}>{h.rarity}</span>
                        <span className="text-border">·</span>
                        <span className="truncate">{h.heroClass}</span>
                        {h.subclass && (
                          <>
                            <span className="text-border">·</span>
                            <span className="truncate">{h.subclass}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-6">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterChip({ label, active, onClick, dotClass, activeTextClass }: { label: string; active: boolean; onClick: () => void; dotClass?: string; activeTextClass?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 font-burbank text-xs uppercase tracking-wider transition-all ${
        active
          ? `border-primary/60 bg-primary/10 ${activeTextClass ?? "text-foreground"}`
          : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      {dotClass && <span className={`size-1.5 rounded-full ${dotClass}`} />}
      {label}
    </button>
  )
}
