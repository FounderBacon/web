"use client"

import { Search as SearchIcon, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { AssetImage } from "@/components/ui/asset-image"
import { fetchSurvivorLeads, type SurvivorLeadSummary } from "@/lib/api/survivor-leads"
import { RARITIES, RARITY_BG, RARITY_TEXT } from "@/lib/constants"
import type { Locale } from "@/lib/i18n"

const SQUAD_TYPES = [
  "doctor",
  "trainer",
  "scavenger",
  "gadgeteer",
  "explorer",
  "soldier",
  "engineer",
  "marksman",
  "martial-artist",
] as const

const TIERS = [1, 2, 3, 4, 5]

interface SurvivorLeadsViewProps {
  locale: Locale
}

export function SurvivorLeadsView({ locale }: SurvivorLeadsViewProps) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [squadType, setSquadType] = useState("")
  const [rarity, setRarity] = useState("")
  const [tier, setTier] = useState<number | "">("")
  const [namedOnly, setNamedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [leads, setLeads] = useState<SurvivorLeadSummary[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [squadType, rarity, tier, namedOnly, debouncedSearch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchSurvivorLeads({
      squadType: squadType || undefined,
      rarity: rarity || undefined,
      tier: tier || undefined,
      isNamed: namedOnly || undefined,
      page,
      limit: 24,
    })
      .then((res) => {
        if (cancelled) return
        // Filtrage cote front sur la recherche par nom (l'API n'a pas de search)
        const filtered = debouncedSearch
          ? res.data.filter((l) => l.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
          : res.data
        setLeads(filtered)
        setTotalPages(res.pagination.totalPages)
      })
      .catch(() => {
        if (cancelled) return
        setLeads([])
        setTotalPages(1)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [squadType, rarity, tier, namedOnly, page, debouncedSearch])

  const hasFilter = squadType !== "" || rarity !== "" || tier !== "" || namedOnly || search !== ""

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead by name..."
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Squad</span>
          {SQUAD_TYPES.map((s) => {
            const active = squadType === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSquadType(active ? "" : s)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  active ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {s.replace("-", " ")}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Rarity</span>
          {RARITIES.map((r) => {
            const active = rarity === r
            const dotColor = RARITY_BG[r] ?? "bg-muted"
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRarity(active ? "" : r)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  active ? "border-foreground/30 bg-card text-foreground" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                <span className={`size-1.5 rounded-full ${dotColor}`} />
                {r}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tier</span>
          {TIERS.map((t) => {
            const active = tier === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTier(active ? "" : t)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                T{t}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setNamedOnly(!namedOnly)}
            className={`ml-2 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              namedOnly ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            Named only
          </button>
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setSearch("")
              setSquadType("")
              setRarity("")
              setTier("")
              setNamedOnly(false)
            }}
            className="flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {loading && leads.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading leads...</p>
      ) : leads.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No leads match your filters.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {leads.map((l) => {
            const rarityClass = RARITY_TEXT[l.rarity] ?? "text-muted-foreground"
            const dotColor = RARITY_BG[l.rarity] ?? "bg-muted"
            return (
              <li key={l._id}>
                <Link
                  href={`/${locale}/survivor-leads/${l.slug}`}
                  className="group flex h-full flex-col overflow-hidden border border-border/50 bg-card/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-lg"
                >
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted/30">
                    <span className={`absolute right-2 top-2 size-2 rounded-full ${dotColor} shadow-sm`} />
                    {l.isNamed && (
                      <span className="absolute left-2 top-2 rounded-md bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                        Named
                      </span>
                    )}
                    <AssetImage
                      src={l.iconUrl}
                      alt={l.name}
                      className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 border-t border-border/50 bg-card px-3 py-2.5">
                    <p className="truncate text-sm font-semibold leading-tight text-foreground">{l.name}</p>
                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span className={`font-semibold ${rarityClass}`}>{l.rarity}</span>
                      <span className="text-border">·</span>
                      <span className="capitalize">{l.squadType.replace("-", " ")}</span>
                      <span className="text-border">·</span>
                      <span>T{l.tier}</span>
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
  )
}
