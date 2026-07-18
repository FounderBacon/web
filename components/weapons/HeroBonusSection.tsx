"use client"

import { Pencil, Users } from "lucide-react"
import { useState } from "react"
import { LoadoutDrawer } from "@/components/loadout/LoadoutDrawer"
import { AssetImage } from "@/components/ui/asset-image"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { perkIcon, teamPerkIcon } from "@/lib/cdn"
import { RARITY_BORDER, RARITY_TEXT } from "@/lib/constants"
import { countFilledSlots } from "@/lib/loadout/selectors"
import { useLoadout, type LoadoutHeroSlot, type LoadoutTeamPerk } from "@/lib/loadout/store"

export function HeroBonusSection() {
  const commander = useLoadout((s) => s.commander)
  const support = useLoadout((s) => s.support)
  const teamPerks = useLoadout((s) => s.teamPerks)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filled = countFilledSlots({ commander, support, teamPerks })
  const filledSupport = support.filter((s): s is LoadoutHeroSlot => s !== null)

  return (
    <>
      <div className="overflow-hidden border border-border/50">
        <div className="flex items-center justify-between border-b border-border/50 bg-card px-4 py-2">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Hero Bonuses</p>
            {filled > 0 && (
              <span className="text-[11px] tabular-nums text-muted-foreground">({filled})</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Pencil className="size-3" />
            Edit
          </button>
        </div>

        {filled === 0 ? (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-2 px-4 py-6 transition-colors hover:bg-muted/30"
          >
            <Users className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No loadout active</p>
            <p className="text-[11px] text-primary">Pick heroes & team perks</p>
          </button>
        ) : (
          <div className="flex flex-col gap-3 p-3">
            {commander && <CommanderRow slot={commander} />}
            {filledSupport.length > 0 && <SupportRow slots={filledSupport} />}
            {teamPerks.length > 0 && <TeamPerksRow perks={teamPerks} />}
          </div>
        )}
      </div>

      <LoadoutDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}

function CommanderRow({ slot }: { slot: LoadoutHeroSlot }) {
  const accent = RARITY_BORDER[slot.rarity] ?? "border-l-border"
  const rarityClass = RARITY_TEXT[slot.rarity] ?? "text-muted-foreground"

  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Commander</p>
      <div className={`flex items-center gap-2 border border-border/50 border-l-2 ${accent} bg-card/40 px-2 py-1.5`}>
        <div className="relative size-9 shrink-0 overflow-hidden border border-border/50 bg-muted/30">
          <AssetImage src={slot.heroIconUrl} alt={slot.heroName} className="absolute inset-0 size-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-xs font-semibold text-foreground">{slot.heroName}</p>
          <p className={`text-[10px] capitalize ${rarityClass}`}>{slot.rarity}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden border border-border/50 bg-muted/30">
              <AssetImage src={perkIcon(slot.perkName)} alt="" className="absolute inset-0 size-full object-contain" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-[11px] font-semibold leading-snug">{slot.perkDescription}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

function SupportRow({ slots }: { slots: LoadoutHeroSlot[] }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Support team <span className="text-foreground">({slots.length})</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {slots.map((slot, i) => {
          const accent = RARITY_BORDER[slot.rarity] ?? "border-l-border"
          return (
            <Tooltip key={`${slot.heroSlug}-${i}`}>
              <TooltipTrigger asChild>
                <div className={`relative flex size-12 items-center overflow-hidden border border-border/50 border-l-2 ${accent} bg-card/40`}>
                  <AssetImage src={slot.heroIconUrl} alt={slot.heroName} className="absolute inset-0 size-full object-cover" />
                  <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center overflow-hidden border border-border/50 bg-background/85 backdrop-blur-sm">
                    <AssetImage src={perkIcon(slot.perkName)} alt="" className="absolute inset-0 size-full object-contain p-0.5" />
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold">{slot.heroName}</p>
                  <p className="border-t border-background/20 pt-1 text-[11px] font-semibold leading-snug">{slot.perkDescription}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

function TeamPerksRow({ perks }: { perks: LoadoutTeamPerk[] }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Team perks <span className="text-foreground">({perks.length})</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {perks.map((p) => (
          <Tooltip key={p.perkId}>
            <TooltipTrigger asChild>
              <div className="relative size-9 overflow-hidden border border-border/50 bg-card/40">
                <AssetImage src={teamPerkIcon(p.name)} alt={p.name} className="absolute inset-0 size-full object-contain p-1" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold">{p.name}</p>
                <p className="text-[11px] leading-snug text-muted-foreground">{p.requirements}</p>
                {p.description && (
                  <p className="border-t border-background/20 pt-1 text-[11px] leading-snug">{p.description}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
