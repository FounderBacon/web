"use client"

import type { TierData, Perk, PerkSlot } from "@/lib/types/weapon"
import { useState } from "react"
import { parsePerkBonuses, formatBonusValue } from "@/lib/perks"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { RARITY_TEXT } from "@/lib/constants"

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
                const perkBonuses = parsePerkBonuses(perk)
                const color = RARITY_TEXT[perk.rarity] ?? "text-muted-foreground"
                const selectedIndex = group.tiers.findIndex((t) => t.perkId === perk.perkId)
                const maxTier = group.tiers.length - 1

                return (
                  <div key={`${slot.slot}-${perk.perkId}`}>
                    {/* Nom + bonuses structures ou description fallback */}
                    <p className={`text-sm font-semibold ${color}`}>{perk.name}</p>
                    {perkBonuses.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                        {perkBonuses.map((b, j) => (
                          <span key={j} className="text-xs">
                            <span className="capitalize text-muted-foreground">{b.stat}: </span>
                            <span className={b.value > 0 ? "font-semibold text-uncommon-dark dark:text-uncommon" : "font-semibold text-malus-dark dark:text-malus"}>
                              {formatBonusValue(b)}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{perk.description}</p>
                    )}

                    {/* Slider de tier */}
                    {maxTier > 0 && (
                      <PerkTierSlider
                        tierCount={maxTier}
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

      {/* Placeholder */}
      <div className="overflow-hidden border border-dashed border-border/50">
        <div className="border-b border-dashed border-border/50 bg-card/50 px-4 py-2">
          <p className="font-burbank text-sm uppercase tracking-wider text-muted-foreground">Hero Bonuses</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[11px] text-muted-foreground/60">Coming soon</p>
        </div>
      </div>
    </div>
  )
}

function PerkTierSlider({
  tierCount,
  selectedIndex,
  onCommit,
}: {
  tierCount: number
  selectedIndex: number
  onCommit: (index: number) => void
}) {
  const [localValue, setLocalValue] = useState<number | null>(null)
  const display = localValue ?? selectedIndex

  return (
    <div className="mt-2 flex items-center gap-3">
      <Slider
        min={0}
        max={tierCount}
        step={1}
        value={[display]}
        onValueChange={([v]) => setLocalValue(v)}
        onValueCommit={([v]) => {
          setLocalValue(null)
          onCommit(v)
        }}
        className="flex-1"
      />
      <span className="flex size-6 shrink-0 items-center justify-center border border-border/50 bg-card text-xs font-semibold tabular-nums text-foreground">
        {display + 1}
      </span>
    </div>
  )
}
