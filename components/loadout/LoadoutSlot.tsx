"use client"

import { Plus, X } from "lucide-react"
import { useState } from "react"
import { HeroPickerDialog } from "@/components/loadout/HeroPickerDialog"
import { AssetImage } from "@/components/ui/asset-image"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { perkIcon } from "@/lib/cdn"
import { RARITY_BORDER, RARITY_TEXT } from "@/lib/constants"
import type { LoadoutHeroSlot } from "@/lib/loadout/store"

interface LoadoutSlotProps {
  slot: LoadoutHeroSlot | null
  label: string
  kind: "commander" | "support"
  onChange: (slot: LoadoutHeroSlot | null) => void
}

export function LoadoutSlot({ slot, label, kind, onChange }: LoadoutSlotProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  if (!slot) {
    return (
      <>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center gap-3 border border-dashed border-border bg-card/20 px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-card/40"
        >
          <div className="flex size-12 shrink-0 items-center justify-center border border-dashed border-border/50 bg-muted/20">
            <Plus className="size-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
            <span className="text-sm text-muted-foreground">Add {kind} hero</span>
          </div>
        </button>
        <HeroPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          slotKind={kind}
          onSelect={(s) => onChange(s)}
        />
      </>
    )
  }

  const rarityClass = RARITY_TEXT[slot.rarity] ?? "text-muted-foreground"
  const accent = RARITY_BORDER[slot.rarity] ?? "border-l-border"

  return (
    <>
      <div className={`group relative flex items-center gap-3 border border-border/50 border-l-2 ${accent} bg-card/40 px-3 py-2.5`}>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <div className="relative size-12 shrink-0 overflow-hidden border border-border/50 bg-muted/30">
            <AssetImage src={slot.heroIconUrl} alt={slot.heroName} className="absolute inset-0 size-full object-cover" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-sm font-semibold text-foreground">{slot.heroName}</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className={`capitalize ${rarityClass}`}>{slot.rarity}</span>
              <span>·</span>
              <span className="capitalize">{slot.heroClass}</span>
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden border border-border/50 bg-muted/30">
                <AssetImage src={perkIcon(slot.perkName)} alt="" className="absolute inset-0 size-full object-contain" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-[11px] font-semibold leading-snug">{slot.perkDescription}</p>
            </TooltipContent>
          </Tooltip>
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove"
          // Toujours visible sur mobile (pas de hover), reveal-on-hover desktop pour rester subtle
          className="absolute right-1 top-1 flex size-6 items-center justify-center text-muted-foreground opacity-100 transition-opacity hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <HeroPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        slotKind={kind}
        onSelect={(s) => onChange(s)}
      />
    </>
  )
}
