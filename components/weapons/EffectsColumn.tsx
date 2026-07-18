"use client"

import type { TierData, Perk, PerkSlot } from "@/lib/types/weapon"
import { useCallback, useRef, useState } from "react"
import { Separator } from "@/components/ui/separator"
import { RARITY_TEXT } from "@/lib/constants"
import { HeroBonusSection } from "@/components/weapons/HeroBonusSection"

interface EffectsColumnProps {
  tierData: TierData
  slots: PerkSlot[]
  selectedPerks: Record<number, Perk | null>
  onPerkChange: (slot: number, perk: Perk | null) => void
  isRanged: boolean
  weaponPerk?: Perk | null
  weaponPerkLevel?: number
}

interface PerkGroup {
  name: string
  tiers: Perk[]
}

function groupPerks(perks: Perk[]): PerkGroup[] {
  const map = new Map<string, Perk[]>()
  for (const perk of perks) {
    if (!perk.name) continue
    if (!map.has(perk.name)) map.set(perk.name, [])
    map.get(perk.name)!.push(perk)
  }
  return Array.from(map.entries()).map(([name, tiers]) => ({ name, tiers }))
}

export function EffectsColumn({
  tierData,
  slots,
  selectedPerks,
  onPerkChange,
  isRanged,
  weaponPerk,
  weaponPerkLevel,
}: EffectsColumnProps) {
  // Construire la liste des perks actifs avec leur slot pour retrouver le groupe
  const activeEntries: { slot: PerkSlot; perk: Perk; group: PerkGroup }[] = []
  for (const slot of slots) {
    const perk = selectedPerks[slot.slot]
    if (!perk) continue
    const groups = groupPerks(slot.availablePerks)
    const group = groups.find((g) => g.tiers.some((t) => t.perkId === perk.perkId))
    if (group) activeEntries.push({ slot, perk, group })
  }

  return (
    <div className="space-y-4">
      {/* Effects */}
      <div className="overflow-hidden border border-border/50">
        <div className="border-b border-border/50 bg-card px-4 py-2">
          <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Effects</p>
        </div>
        <div className="p-4">
          {activeEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Select perks to see their effects here
            </p>
          ) : (
            <div className="space-y-4">
              {activeEntries.map(({ slot, perk, group }, i) => {
                const color = RARITY_TEXT[perk.rarity] ?? "text-muted-foreground"
                const selectedIndex = group.tiers.findIndex((t) => t.perkId === perk.perkId)
                const maxTier = group.tiers.length - 1

                return (
                  <div key={`${slot.slot}-${perk.perkId}`}>
                    {/* Affichage brut : on garde la description verbatim pour preserver le contexte (ex: element fire) */}
                    <p className={`text-sm font-semibold ${color}`}>{perk.description}</p>

                    {/* Slider de tier avec ticks visuels */}
                    {maxTier > 0 && (
                      <PerkTierSlider
                        tiers={group.tiers}
                        selectedIndex={selectedIndex}
                        onCommit={(idx) => {
                          const target = group.tiers[idx]
                          if (target) onPerkChange(slot.slot, target)
                        }}
                      />
                    )}

                    {i < activeEntries.length - 1 && <Separator className="mt-3" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Weapon Perk */}
      {weaponPerk && (
        <div className="overflow-hidden border border-border/50">
          <div className="flex items-center justify-between border-b border-border/50 bg-card px-4 py-2">
            <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Weapon Perk</p>
            {weaponPerkLevel !== undefined && (
              <span className="text-sm text-muted-foreground">Lv.{weaponPerkLevel}</span>
            )}
          </div>
          <div className="p-4">
            <p className="text-sm font-medium text-foreground">{weaponPerk.name}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{weaponPerk.description}</p>
          </div>
        </div>
      )}

      {/* Hero loadout actif (commander + support + team perks) */}
      <HeroBonusSection />
    </div>
  )
}

// Slider segmente : N tiers separes physiquement (gap entre les segments), drag + click + clavier
function PerkTierSlider({
  tiers,
  selectedIndex,
  onCommit,
}: {
  tiers: Perk[]
  selectedIndex: number
  onCommit: (index: number) => void
}) {
  const [localValue, setLocalValue] = useState<number | null>(null)
  const display = localValue ?? selectedIndex
  const maxIdx = tiers.length - 1
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  // Calcule l'index correspondant a une position X (en pixels) dans le container.
  // Convention "fin de segment" : le segment i couvre [i/N, (i+1)/N].
  // Le thumb est positionne a (display+1)/N, donc cliquer dessus garde le segment courant.
  const indexFromX = useCallback((clientX: number): number => {
    const el = containerRef.current
    if (!el) return display
    const rect = el.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    const idx = Math.ceil(ratio * tiers.length) - 1
    return Math.max(0, Math.min(maxIdx, idx))
  }, [display, maxIdx, tiers.length])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    draggingRef.current = true
    containerRef.current?.setPointerCapture(e.pointerId)
    setLocalValue(indexFromX(e.clientX))
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return
    setLocalValue(indexFromX(e.clientX))
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return
    draggingRef.current = false
    containerRef.current?.releasePointerCapture(e.pointerId)
    const finalIdx = indexFromX(e.clientX)
    setLocalValue(null)
    onCommit(finalIdx)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    let next = display
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(0, display - 1)
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(maxIdx, display + 1)
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = maxIdx
    else return
    e.preventDefault()
    onCommit(next)
  }

  return (
    <div className="mt-2 flex items-center gap-3">
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={1}
        aria-valuemax={tiers.length}
        aria-valuenow={display + 1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative flex flex-1 cursor-pointer touch-none items-center gap-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {tiers.map((_, i) => {
          const filled = i <= display
          return (
            <div
              key={i}
              className={`h-2 flex-1 rounded-sm transition-colors ${filled ? "bg-primary" : "bg-muted"}`}
            />
          )
        })}
        {/* Thumb : a la fin (droite) du segment courant */}
        <div
          className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow transition-[left]"
          style={{ left: `${((display + 1) / tiers.length) * 100}%` }}
        />
      </div>
      <span className="flex size-6 shrink-0 items-center justify-center border border-border/50 bg-card text-xs font-bold tabular-nums text-foreground">
        {display + 1}
      </span>
    </div>
  )
}
