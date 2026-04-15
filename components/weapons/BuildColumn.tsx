"use client"

import { useState } from "react"
import type { PerkSlot, Perk } from "@/lib/types/weapon"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { RotateCcw, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface BuildColumnProps {
  slots: PerkSlot[]
  selectedPerks: Record<number, Perk | null>
  onSelect: (slot: number, perk: Perk | null) => void
  onHover: (perk: Perk | null) => void
  onResetAll: () => void
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

export function BuildColumn({ slots, selectedPerks, onSelect, onHover, onResetAll }: BuildColumnProps) {
  const hasPerks = Object.values(selectedPerks).some(Boolean)
  const [openSlots, setOpenSlots] = useState<Set<number>>(new Set(slots.map((s) => s.slot)))

  function toggleSlot(slotNum: number) {
    setOpenSlots((prev) => {
      const next = new Set(prev)
      if (next.has(slotNum)) next.delete(slotNum)
      else next.add(slotNum)
      return next
    })
  }

  return (
    <div className="overflow-hidden border border-border/50">
      <div className="flex items-center justify-between border-b border-border/50 bg-card px-4 py-2">
        <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Perks</p>
        {hasPerks && (
          <Button variant="ghost" size="xs" onClick={onResetAll} className="text-muted-foreground">
            <RotateCcw className="size-3" />
            Reset
          </Button>
        )}
      </div>

      <div className="divide-y divide-border/50">
        {slots.map((slot) => {
          const selected = selectedPerks[slot.slot] ?? null
          const isOpen = openSlots.has(slot.slot)
          const groups = groupPerks(slot.availablePerks)
          const selectedName = selected
            ? groups.find((g) => g.tiers.some((t) => t.perkId === selected.perkId))?.name
            : null

          return (
            <div key={slot.slot} className={selected ? "bg-primary/5" : ""}>
              {/* Header du slot -- cliquable pour ouvrir/fermer */}
              <button
                type="button"
                onClick={() => toggleSlot(slot.slot)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              >
                {/* Numero du slot */}
                <span className={`flex size-8 shrink-0 items-center justify-center text-sm font-bold tabular-nums ${
                  selected ? "bg-primary/20 text-foreground" : "border border-border/50 bg-card text-foreground"
                }`}>
                  {slot.slot + 1}
                </span>

                {/* Nom du perk selectionne ou placeholder */}
                <div className="min-w-0 flex-1">
                  {selected ? (
                    <p className="truncate text-sm font-semibold text-foreground">{selected.name}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">Empty</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">Lv.{slot.unlockLevel}</p>
                </div>

                {/* Chevron */}
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Liste des perks disponibles */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/30 bg-muted/30 px-4 py-2">
                      <div className="space-y-0.5">
                        {groups.map((group) => {
                          const isActive = group.name === selectedName
                          return (
                            <Tooltip key={group.name}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => onSelect(slot.slot, isActive ? null : group.tiers[0])}
                                    onMouseEnter={() => !isActive && onHover(group.tiers[0])}
                                    onMouseLeave={() => !isActive && onHover(null)}
                                    className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors ${
                                      isActive
                                        ? "bg-primary/20 font-medium text-foreground"
                                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                                    }`}
                                  >
                                    {/* TODO: icone perk quand dispo */}
                                    <span className="truncate">{group.name}</span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="flex max-w-72 flex-col items-start gap-1 bg-popover text-start text-popover-foreground">
                                  <p className="text-xs font-semibold">{group.name}</p>
                                  <p className="text-xs leading-relaxed text-muted-foreground">{group.tiers[0].description}</p>
                                </TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
