"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { fetchRangedWeapons, fetchMeleeWeapons } from "@/lib/api/weapons"
import { weaponIcon } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import { AssetImage } from "@/components/ui/asset-image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { WeaponRef } from "@/lib/compare/useCompareSlot"

interface PickerResult {
  type: "ranged" | "melee"
  slug: string
  name: string
  rarity: string
  category: string
  icon: string
}

interface WeaponPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (ref: WeaponRef) => void
}

const SEARCH_DEBOUNCE_MS = 250
const LIMIT_PER_TYPE = 12

export function WeaponPicker({ open, onOpenChange, onSelect }: WeaponPickerProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PickerResult[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Recherche debouncee sur les deux catalogues en parallele.
  useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)

      const params = { search: query.trim() || undefined, limit: LIMIT_PER_TYPE }

      Promise.all([
        fetchRangedWeapons(params).catch(() => null),
        fetchMeleeWeapons(params).catch(() => null),
      ])
        .then(([ranged, melee]) => {
          if (controller.signal.aborted) return
          const merged: PickerResult[] = [
            ...(ranged?.data ?? []).map((w) => ({
              type: "ranged" as const,
              slug: w.slug,
              name: w.name,
              rarity: w.rarity,
              category: w.category,
              icon: w.icon,
            })),
            ...(melee?.data ?? []).map((w) => ({
              type: "melee" as const,
              slug: w.slug,
              name: w.name,
              rarity: w.rarity,
              category: w.category,
              icon: w.icon,
            })),
          ]
          setResults(merged)
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, open])

  // Reset a la fermeture pour repartir propre au prochain ouverture.
  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
    }
  }, [open])

  function handleSelect(item: PickerResult) {
    onSelect({ type: item.type, slug: item.slug })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-border/50 px-4 py-3">
          <DialogTitle className="font-burbank text-sm uppercase tracking-wider">Select a weapon</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search weapons..."
            className="w-full bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X className="size-4 text-muted-foreground transition-colors hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && results.length === 0 && (
            <div className="flex justify-center py-8">
              <div className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No weapon found.</p>
          )}

          <div className="divide-y divide-border/30">
            {results.map((item) => (
              <button
                key={`${item.type}:${item.slug}`}
                type="button"
                onClick={() => handleSelect(item)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
              >
                <AssetImage
                  src={weaponIcon(item.icon, item.type === "ranged" ? "weapons-ranged" : "weapons-melee")}
                  alt={item.name}
                  className="size-8 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-[11px] capitalize text-muted-foreground">
                    <span className={RARITY_TEXT[item.rarity] ?? ""}>{item.rarity}</span>
                    {" / "}
                    {item.category}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
