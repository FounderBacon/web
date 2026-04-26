"use client"

import { ChevronRight, Search, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { fetchTraps } from "@/lib/api/traps"
import { fetchMeleeWeapons, fetchRangedWeapons } from "@/lib/api/weapons"
import { weaponIcon } from "@/lib/cdn"
import { RARITY_DECO } from "@/lib/constants"
import type { Locale } from "@/lib/i18n"

// ── Tree de filtres : root -> sous-menus ──────────────────────────
interface FilterOption {
  key: string
  label: string
  children?: string // identifiant du sous-menu si c'est une branche
  disabled?: boolean
}

const FILTER_TREE: Record<string, FilterOption[]> = {
  root: [
    { key: "weapons", label: "Weapons", children: "weapons" },
    { key: "traps", label: "Traps", children: "traps" },
    { key: "heroes", label: "Heroes", disabled: true },
    { key: "survivors", label: "Survivors", disabled: true },
    { key: "rarity", label: "Rarity", children: "rarity" },
  ],
  weapons: [
    { key: "ranged", label: "Ranged", children: "ranged-cat" },
    { key: "melee", label: "Melee", children: "melee-cat" },
  ],
  "ranged-cat": [
    { key: "assault", label: "Assault" },
    { key: "sniper", label: "Sniper" },
    { key: "pistol", label: "Pistol" },
    { key: "shotgun", label: "Shotgun" },
    { key: "smg", label: "SMG" },
    { key: "launcher", label: "Launcher" },
  ],
  "melee-cat": [
    { key: "sword", label: "Sword" },
    { key: "hardware", label: "Hardware" },
    { key: "spear", label: "Spear" },
    { key: "scythe", label: "Scythe" },
    { key: "axe", label: "Axe" },
    { key: "club", label: "Club" },
  ],
  traps: [
    { key: "floor", label: "Floor" },
    { key: "wall", label: "Wall" },
    { key: "ceiling", label: "Ceiling" },
  ],
  rarity: [
    { key: "common", label: "Common" },
    { key: "uncommon", label: "Uncommon" },
    { key: "rare", label: "Rare" },
    { key: "epic", label: "Epic" },
    { key: "legendary", label: "Legendary" },
    { key: "mythic", label: "Mythic" },
  ],
}

interface FilterChip {
  key: string
  label: string
}

// Sets pour deduire le sens d'une chip dans le path
const RANGED_CATS = new Set(["assault", "sniper", "pistol", "shotgun", "smg", "launcher"])
const MELEE_CATS = new Set(["sword", "hardware", "spear", "scythe", "axe", "club"])
const PLACEMENTS = new Set(["floor", "wall", "ceiling"])
const RARITIES = new Set(["common", "uncommon", "rare", "epic", "legendary", "mythic"])

// ── Conversion path -> sources/params ─────────────────────────────
type Source = "ranged" | "melee" | "trap"

function pathToFilters(path: FilterChip[]): {
  sources: Source[]
  params: { search?: string; category?: string; placement?: string; rarity?: string }
} {
  const keys = path.map((p) => p.key)
  const params: { category?: string; placement?: string; rarity?: string } = {}

  let sources: Source[] = ["ranged", "melee", "trap"]
  if (keys.includes("weapons")) sources = sources.filter((s) => s !== "trap")
  if (keys.includes("traps")) sources = ["trap"]
  if (keys.includes("ranged")) sources = sources.filter((s) => s === "ranged")
  if (keys.includes("melee")) sources = sources.filter((s) => s === "melee")

  for (const k of keys) {
    if (RANGED_CATS.has(k) || MELEE_CATS.has(k)) params.category = k
    else if (PLACEMENTS.has(k)) params.placement = k
    else if (RARITIES.has(k)) params.rarity = k
  }

  return { sources, params }
}

interface SearchResult {
  type: "weapon-ranged" | "weapon-melee" | "trap"
  slug: string
  name: string
  rarity: string
  icon: string
  subtype: string
}

interface SearchDialogProps {
  locale: Locale
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ locale, open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [filterPath, setFilterPath] = useState<FilterChip[]>([])
  const [currentMenu, setCurrentMenu] = useState<string | null>("root")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset au close
  useEffect(() => {
    if (!open) {
      setQuery("")
      setFilterPath([])
      setCurrentMenu("root")
      setResults([])
      setActiveIndex(0)
    }
  }, [open])

  // Memo des params actuels
  const filterState = useMemo(() => pathToFilters(filterPath), [filterPath])

  // Fetch debounced
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const search = query.trim()
        const baseParams = {
          ...(search ? { search } : {}),
          ...(filterState.params.category ? { category: filterState.params.category } : {}),
          ...(filterState.params.rarity ? { rarity: filterState.params.rarity } : {}),
          limit: 20,
        }
        const trapParams = {
          ...(search ? { search } : {}),
          ...(filterState.params.placement ? { placement: filterState.params.placement } : {}),
          ...(filterState.params.rarity ? { rarity: filterState.params.rarity } : {}),
          limit: 20,
        }

        const wantRanged = filterState.sources.includes("ranged")
        const wantMelee = filterState.sources.includes("melee")
        const wantTraps = filterState.sources.includes("trap")

        const [ranged, melee, traps] = await Promise.all([
          wantRanged ? fetchRangedWeapons(baseParams).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          wantMelee ? fetchMeleeWeapons(baseParams).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          wantTraps ? fetchTraps(trapParams).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ])

        const all: SearchResult[] = [
          ...ranged.data.map((w) => ({ type: "weapon-ranged" as const, slug: w.slug, name: w.name, rarity: w.rarity, icon: w.icon, subtype: w.category })),
          ...melee.data.map((w) => ({ type: "weapon-melee" as const, slug: w.slug, name: w.name, rarity: w.rarity, icon: w.icon, subtype: w.category })),
          ...traps.data.map((t) => ({ type: "trap" as const, slug: t.slug, name: t.name, rarity: t.rarity, icon: t.icon, subtype: t.placement })),
        ]
        setResults(all.slice(0, 40))
        setActiveIndex(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [open, query, filterState])

  // Auto-scroll de l'item actif
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const item = list.children[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  function selectFilter(opt: FilterOption) {
    if (opt.disabled) return
    setFilterPath((prev) => [...prev, { key: opt.key, label: opt.label }])
    setCurrentMenu(opt.children ?? null)
    inputRef.current?.focus()
  }

  function removeChip(index: number) {
    setFilterPath((prev) => prev.slice(0, index))
    setCurrentMenu("root")
    inputRef.current?.focus()
  }

  const handleSelect = useCallback(
    (r: SearchResult) => {
      onOpenChange(false)
      if (r.type === "trap") {
        router.push(`/${locale}/traps/${r.slug}`)
      } else {
        const t = r.type === "weapon-ranged" ? "ranged" : "melee"
        router.push(`/${locale}/weapons/${t}/${r.slug}`)
      }
    },
    [router, locale, onOpenChange],
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const r = results[activeIndex]
      if (r) handleSelect(r)
    } else if (e.key === "Backspace" && query === "" && filterPath.length > 0) {
      removeChip(filterPath.length - 1)
    }
  }

  function iconUrl(r: SearchResult) {
    if (r.type === "trap") return weaponIcon(r.icon, "traps")
    return weaponIcon(r.icon, r.type === "weapon-ranged" ? "weapons-ranged" : "weapons-melee")
  }

  const menuOptions = currentMenu ? FILTER_TREE[currentMenu] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid w-full max-w-2xl gap-0 overflow-hidden bg-king-900 p-0 sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Search</DialogTitle>

        {/* Input + chips */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          {filterPath.map((chip, i) => (
            <span
              key={`${chip.key}-${i}`}
              className="flex shrink-0 items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 text-xs font-medium capitalize text-primary"
            >
              {chip.label}
              <button type="button" onClick={() => removeChip(i)} className="hover:text-foreground">
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={filterPath.length > 0 ? "Refine..." : "Search weapons, traps..."}
            className="min-w-20 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {loading && (
            <div className="size-3 shrink-0 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
          )}
        </div>

        {/* Menu de filtres en liste verticale */}
        {menuOptions && (
          <ul className="max-h-48 overflow-y-auto border-b border-border py-1">
            {menuOptions.map((opt) => (
              <li key={opt.key}>
                <button
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => selectFilter(opt)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                    opt.disabled
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex-1 capitalize">{opt.label}</span>
                  {opt.children && <ChevronRight className="size-4 text-muted-foreground" />}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Resultats */}
        <ul ref={listRef} className="max-h-96 overflow-y-auto py-1" onKeyDown={handleKeyDown}>
          {results.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              {loading ? "Searching..." : "No results"}
            </li>
          ) : (
            results.map((r, i) => {
              const colorClass = RARITY_DECO[r.rarity] ?? "text-primary"
              return (
                <li key={`${r.type}-${r.slug}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(r)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                      i === activeIndex ? "bg-muted" : ""
                    }`}
                  >
                    <Image
                      src={iconUrl(r)}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 shrink-0"
                      unoptimized
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{r.subtype}</p>
                    </div>
                    <span className={`text-xs font-medium capitalize ${colorClass}`}>{r.rarity}</span>
                  </button>
                </li>
              )
            })
          )}
        </ul>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">↑↓</kbd>
            navigate
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">esc</kbd>
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
