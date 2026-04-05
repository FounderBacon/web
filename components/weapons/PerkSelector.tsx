"use client"

import { useState } from "react"
import type { PerkSlot, Perk } from "@/lib/types/weapon"
import { parsePerkBonuses, formatBonusValue } from "@/lib/perks"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RARITY_BG, RARITY_TEXT } from "@/lib/constants"

interface PerkSelectorProps {
  slots: PerkSlot[]
  selectedPerks: Record<number, Perk | null>
  onSelect: (slot: number, perk: Perk | null) => void
  onHover: (perk: Perk | null) => void
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

export function PerkSelector({ slots, selectedPerks, onSelect, onHover }: PerkSelectorProps) {
  return (
    <div className="space-y-5">
      {slots.map((slot) => (
        <PerkSlotRow
          key={slot.slot}
          slot={slot}
          selected={selectedPerks[slot.slot] ?? null}
          onSelect={(perk) => onSelect(slot.slot, perk)}
          onHover={onHover}
        />
      ))}
    </div>
  )
}

function PerkSlotRow({ slot, selected, onSelect, onHover }: { slot: PerkSlot; selected: Perk | null; onSelect: (perk: Perk | null) => void; onHover: (perk: Perk | null) => void }) {
  const groups = groupPerks(slot.availablePerks)
  const selectedGroup = selected ? groups.find((g) => g.tiers.some((t) => t.perkId === selected.perkId)) : null

  function handleSelectChange(value: string) {
    if (value === "__clear__") {
      onSelect(null)
      return
    }
    const group = groups.find((g) => g.name === value)
    if (group) onSelect(group.tiers[0])
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-akkordeon-11 text-sm uppercase text-foreground">Slot {slot.slot + 1}</span>
          <span className="text-xs text-muted-foreground">Lv.{slot.unlockLevel}</span>
        </div>
        {selected && (
          <button type="button" onClick={() => onSelect(null)} className="cursor-pointer font-akkordeon-11 text-xs uppercase text-muted-foreground hover:text-foreground">Clear</button>
        )}
      </div>

      <Select value={selectedGroup?.name ?? ""} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-full cursor-pointer">
          <SelectValue placeholder="Select a perk..." />
        </SelectTrigger>
        <SelectContent>
          {groups.map((group) => (
            <SelectItem
              key={group.name}
              value={group.name}
              className="cursor-pointer"
              onMouseEnter={() => onHover(group.tiers[0])}
              onMouseLeave={() => onHover(null)}
            >
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && selectedGroup && (
        <div className="flex items-start gap-2">
          {/* Jauge de tiers */}
          {selectedGroup.tiers.length > 1 && (
            <div className="flex w-8 shrink-0 flex-col-reverse gap-0.5 self-stretch">
              {Array.from({ length: 5 }).map((_, i) => {
                const perk = selectedGroup.tiers[i]
                const selectedIndex = selectedGroup.tiers.findIndex((t) => t.perkId === selected.perkId)
                const isFilled = i <= selectedIndex
                const activeBg = RARITY_BG[selected.rarity] ?? "bg-common"

                return (
                  <TooltipProvider key={i} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          disabled={!perk}
                          onClick={() => perk && onSelect(perk)}
                          onMouseEnter={() => perk && onHover(perk)}
                          onMouseLeave={() => onHover(null)}
                          className={`flex-1 w-full transition-opacity ${perk ? "cursor-pointer" : "cursor-default"} ${isFilled ? activeBg : "bg-common opacity-20"} ${!perk ? "opacity-5" : !isFilled ? "hover:opacity-40" : ""}`}
                        />
                      </TooltipTrigger>
                      {perk && (
                        <TooltipContent side="left">
                          <p className="text-xs">{perk.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          )}

          {/* Description */}
          <Card className="flex-1">
            <CardContent className="p-3">
              <p className="text-xs leading-snug text-muted-foreground">{selected.description}</p>
              <PerkBonuses perk={selected} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function PerkBonuses({ perk }: { perk: Perk }) {
  const bonuses = parsePerkBonuses(perk)
  if (bonuses.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
      {bonuses.map((b, i) => (
        <span key={i} className="text-xs">
          <span className="capitalize text-muted-foreground">{b.stat}: </span>
          <span className={b.value > 0 ? "text-uncommon-dark dark:text-uncommon" : "text-malus-dark dark:text-malus"}>{formatBonusValue(b)}</span>
        </span>
      ))}
    </div>
  )
}
