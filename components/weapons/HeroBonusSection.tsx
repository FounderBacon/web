"use client"

import { Pencil, RotateCcw, Users } from "lucide-react"
import { useState } from "react"
import { LoadoutDrawer } from "@/components/loadout/LoadoutDrawer"
import { LocalLoadoutSheet } from "@/components/loadout/LocalLoadoutSheet"
import { AssetImage } from "@/components/ui/asset-image"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { perkIcon, teamPerkIcon } from "@/lib/cdn"
import type { HeroBuild } from "@/lib/compare/hero"
import { useCompareT } from "@/lib/compare/i18n"
import { RARITY_BORDER, RARITY_TEXT } from "@/lib/constants"
import { countFilledSlots } from "@/lib/loadout/selectors"
import { useLoadout, type LoadoutHeroSlot, type LoadoutTeamPerk } from "@/lib/loadout/store"

interface HeroBonusSectionProps {
  // Loadout propre a cette fiche ; absent, la fiche suit le profil.
  localHero: HeroBuild | undefined
  onLocalHeroChange: (hero: HeroBuild | undefined) => void
  // "column" : la fiche a ete ouverte depuis une colonne du comparateur, et
  // c'est le loadout de cette colonne qu'on edite.
  context?: "weapon" | "column"
}

/**
 * Loadout de heros applique a la fiche, et d'ou il vient.
 *
 * Deux sources, toujours affichees : le profil (partage par toutes les pages,
 * modifie dans LoadoutDrawer) ou un loadout local a cette fiche (modifie dans
 * LocalLoadoutSheet, sans toucher au profil). Avant, "Edit" ouvrait toujours le
 * profil : impossible de regler le build de heros d'une arme sans changer
 * celui de toutes les autres.
 */
export function HeroBonusSection({ localHero, onLocalHeroChange, context = "weapon" }: HeroBonusSectionProps) {
  const t = useCompareT()
  const profileCommander = useLoadout((s) => s.commander)
  const profileSupport = useLoadout((s) => s.support)
  const profileTeamPerks = useLoadout((s) => s.teamPerks)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [localOpen, setLocalOpen] = useState(false)

  const isLocal = !!localHero
  // Loadout local recu par lien : seuls les identifiants de perks ont voyage.
  const unknownHeroes = isLocal && !localHero.slots
  const commander = isLocal ? (localHero.slots?.commander ?? null) : profileCommander
  const support = isLocal ? (localHero.slots?.support ?? []) : profileSupport
  const teamPerks = isLocal ? (localHero.slots?.teamPerks ?? []) : profileTeamPerks

  const filled = countFilledSlots({ commander, support, teamPerks })
  const filledSupport = support.filter((s): s is LoadoutHeroSlot => s !== null)

  const sourceLabel = !isLocal ? t.sourceProfile : context === "column" ? t.sourceColumn : t.sourceWeapon

  return (
    <>
      <div className="overflow-hidden border border-border/50">
        <div className="flex flex-col gap-1.5 border-b border-border/50 bg-card px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Users className="size-4 shrink-0 text-muted-foreground" />
              <p className="truncate font-burbank text-sm uppercase tracking-wider text-foreground">{t.heroBonusTitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {isLocal ? (
                <button
                  type="button"
                  onClick={() => setLocalOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Pencil className="size-3" />
                  {t.editLocal}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Pencil className="size-3" />
                  {t.editProfile}
                </button>
              )}
            </div>
          </div>

          {/* La source se lit sans ouvrir quoi que ce soit : c'est elle qui dit
              si modifier ici touche les autres pages. Sur sa propre ligne, la
              colonne est trop etroite pour la porter a cote du titre. */}
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span
              title={isLocal && localHero.name ? `${sourceLabel} · ${localHero.name}` : sourceLabel}
              className={`min-w-0 truncate px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                isLocal ? "bg-primary/20 text-primary-foreground" : "bg-muted/60 text-muted-foreground"
              }`}
            >
              {isLocal && localHero.name ? `${sourceLabel} · ${localHero.name}` : sourceLabel}
            </span>
            {/* Action secondaire : passer en local, ou en revenir. */}
            {isLocal ? (
              <button
                type="button"
                onClick={() => onLocalHeroChange(undefined)}
                className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                {t.useProfile}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLocalOpen(true)}
                className="shrink-0 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
              >
                {context === "column" ? t.customizeColumn : t.customizeWeapon}
              </button>
            )}
          </div>
        </div>

        {unknownHeroes ? (
          <p className="px-4 py-4 text-xs leading-relaxed text-muted-foreground">{t.heroUnknown}</p>
        ) : filled === 0 ? (
          <button
            type="button"
            onClick={() => (isLocal ? setLocalOpen(true) : setDrawerOpen(true))}
            className="flex w-full flex-col items-center justify-center gap-2 px-4 py-6 transition-colors hover:bg-muted/30"
          >
            <Users className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{t.noLoadout}</p>
            <p className="text-[11px] text-primary">{t.noLoadoutCta}</p>
          </button>
        ) : (
          <div className="flex flex-col gap-3 p-3">
            {commander && <CommanderRow slot={commander} label={t.heroCommander} />}
            {filledSupport.length > 0 && <SupportRow slots={filledSupport} label={t.heroSupport} />}
            {teamPerks.length > 0 && <TeamPerksRow perks={teamPerks} label={t.heroTeamPerks} />}
          </div>
        )}
      </div>

      <LoadoutDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <LocalLoadoutSheet
        open={localOpen}
        onOpenChange={setLocalOpen}
        hero={localHero}
        onApply={onLocalHeroChange}
        title={context === "column" ? t.heroEditTitle : t.weaponLoadoutTitle}
        hint={context === "column" ? t.columnFromWeaponHint : t.weaponLoadoutHint}
      />
    </>
  )
}

function CommanderRow({ slot, label }: { slot: LoadoutHeroSlot; label: string }) {
  const accent = RARITY_BORDER[slot.rarity] ?? "border-l-border"
  const rarityClass = RARITY_TEXT[slot.rarity] ?? "text-muted-foreground"

  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
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

function SupportRow({ slots, label }: { slots: LoadoutHeroSlot[]; label: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label} <span className="text-foreground">({slots.length})</span>
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

function TeamPerksRow({ perks, label }: { perks: LoadoutTeamPerk[]; label: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label} <span className="text-foreground">({perks.length})</span>
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
