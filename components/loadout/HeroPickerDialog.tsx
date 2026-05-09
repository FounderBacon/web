"use client"

import { Search as SearchIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { AssetImage } from "@/components/ui/asset-image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { fetchHero, fetchHeroes, type HeroClass, type HeroSummary } from "@/lib/api/heroes"
import { perkIcon } from "@/lib/cdn"
import { buildHeroSlot } from "@/lib/loadout/buildSlot"
import { RARITIES_VISIBLE, RARITY_BG, RARITY_TEXT } from "@/lib/constants"

const HERO_CLASSES: HeroClass[] = ["soldier", "constructor", "ninja", "outlander"]

type SlotKind = "commander" | "support"

interface HeroPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slotKind: SlotKind
  onSelect: (slot: LoadoutHeroSlot) => void
}

export function HeroPickerDialog({ open, onOpenChange, slotKind, onSelect }: HeroPickerDialogProps) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [heroClass, setHeroClass] = useState<HeroClass | "">("")
  const [rarity, setRarity] = useState("")
  const [heroes, setHeroes] = useState<HeroSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  // Cache des perks (commander ou standard) par hero slug, fetch lazy au hover
  const [perkCache, setPerkCache] = useState<Record<string, { name: string; description: string }>>({})

  useEffect(() => {
    if (!open) {
      setSearch("")
      setHeroClass("")
      setRarity("")
      setHeroes([])
      setBusySlug(null)
      setPerkCache({})
      setPage(1)
    }
  }, [open])

  // Reset page quand un filtre change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, heroClass, rarity])

  async function ensurePerk(slug: string) {
    if (perkCache[slug]) return
    try {
      const detail = await fetchHero(slug)
      const perk = slotKind === "commander" ? detail.commanderPerk : detail.standardPerk
      if (perk) {
        setPerkCache((prev) => ({
          ...prev,
          [slug]: { name: perk.name, description: perk.description },
        }))
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    fetchHeroes({
      search: debouncedSearch || undefined,
      heroClass: heroClass || undefined,
      rarity: rarity || undefined,
      page,
      limit: 24,
    })
      .then((res) => {
        if (cancelled) return
        setHeroes(res.data)
        setTotalPages(res.pagination.totalPages)
        setTotal(res.pagination.total)
      })
      .catch(() => {
        if (cancelled) return
        setHeroes([])
        setTotalPages(1)
        setTotal(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, debouncedSearch, heroClass, rarity, page])

  async function handlePick(hero: HeroSummary) {
    setBusySlug(hero.slug)
    let detail
    try {
      detail = await fetchHero(hero.slug)
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[HeroPicker] fetchHero failed:", err)
      }
      setBusySlug(null)
      return
    }

    try {
      const slot = await buildHeroSlot(detail, slotKind)
      if (!slot) {
        setBusySlug(null)
        return
      }
      onSelect(slot)
      onOpenChange(false)
    } finally {
      setBusySlug(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid w-full max-w-2xl gap-0 overflow-hidden bg-king-900 p-0 sm:max-w-2xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Pick a hero</DialogTitle>

        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${slotKind} by hero or perk name...`}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {loading && <div className="size-3 shrink-0 animate-spin rounded-full border border-muted-foreground border-t-transparent" />}
        </div>

        <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {HERO_CLASSES.map((c) => {
              const active = heroClass === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setHeroClass(active ? "" : c)}
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize transition-colors ${
                    active ? "border-primary bg-primary/20 text-foreground" : "border-border/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RARITIES_VISIBLE.map((r) => {
              const active = rarity === r
              const dot = RARITY_BG[r] ?? "bg-muted"
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRarity(active ? "" : r)}
                  className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize transition-colors ${
                    active ? "border-foreground/30 bg-card text-foreground" : "border-border/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${dot}`} />
                  {r}
                </button>
              )
            })}
          </div>
        </div>

        <TooltipProvider delayDuration={200}>
          <ul className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto p-3 sm:grid-cols-4">
            {heroes.length === 0 && !loading ? (
              <li className="col-span-full px-4 py-10 text-center text-sm text-muted-foreground">No heroes found</li>
            ) : (
              heroes.map((h) => {
                const rarityClass = RARITY_TEXT[h.rarity] ?? "text-muted-foreground"
                const busy = busySlug === h.slug
                const perkInfo = perkCache[h.slug]
                return (
                  <li key={h._id}>
                    <button
                      type="button"
                      onMouseEnter={() => ensurePerk(h.slug)}
                      onFocus={() => ensurePerk(h.slug)}
                      onClick={() => handlePick(h)}
                      disabled={busy}
                      className="group flex w-full flex-col items-center gap-1.5 border border-border/50 bg-card/40 p-2 transition-colors hover:border-primary/50 hover:bg-card/60 disabled:opacity-50"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
                        <AssetImage src={h.iconUrl} alt={h.name} className="absolute inset-0 size-full object-contain p-1" />
                        {perkInfo && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="absolute bottom-0.5 right-0.5 flex size-7 items-center justify-center overflow-hidden border border-border bg-background/85 backdrop-blur-sm">
                                <AssetImage src={perkIcon(perkInfo.name)} alt="" className="absolute inset-0 size-full object-contain p-0.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="flex flex-col gap-1">
                                <p className="font-semibold">{perkInfo.name}</p>
                                <p className="text-[11px] leading-snug">{perkInfo.description}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <p className="w-full truncate text-center text-xs font-medium text-foreground">{h.name}</p>
                      <p className={`text-[10px] uppercase ${rarityClass}`}>{h.rarity}</p>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </TooltipProvider>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {total} heroes · Page {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
