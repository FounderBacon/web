"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Repeat, X } from "lucide-react"
import { AssetImage } from "@/components/ui/asset-image"
import { Button } from "@/components/ui/button"
import { weaponIcon } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import { WeaponPicker } from "./WeaponPicker"
import type { CompareSlotState, WeaponRef } from "@/lib/compare/useCompareSlot"
import type { RangedWeaponDetail } from "@/lib/types/weapon"

interface CompareCardProps {
  slot: CompareSlotState
  color: string
  locale: string
  onPick: (ref: WeaponRef) => void
  onClear: () => void
  removable?: boolean
}

/**
 * Carte d'une colonne du comparateur, en lecture seule.
 *
 * Le build (tier, materiau, level, perks) se regle sur la fiche de l'arme puis
 * s'ajoute au comparateur : afficher ici les selecteurs repoussait le tableau
 * de stats hors de l'ecran, alors que c'est le but de la page.
 */
export function CompareCard({ slot, color, locale, onPick, onClear, removable }: CompareCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const { weapon } = slot

  if (!weapon) {
    return (
      <>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={slot.loading}
          className="flex min-h-28 w-full flex-col items-center justify-center gap-2 border border-dashed border-border/60 p-4 transition-colors hover:border-primary/50 hover:bg-muted/30 disabled:opacity-50"
        >
          {slot.loading ? (
            <div className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          ) : (
            <>
              <Plus className="size-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {slot.error ? "Not found — pick another" : "Add a weapon"}
              </span>
            </>
          )}
        </button>
        <WeaponPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={onPick} />
      </>
    )
  }

  const isRanged = weapon.type === "ranged"
  const rarityColor = RARITY_TEXT[weapon.rarity] ?? "text-muted-foreground"

  // Resume du build : ce que porte cette colonne, sans controle editable.
  const build: string[] = [`Tier ${slot.tier}`]
  if (slot.hasSplit) build.push(slot.material)
  if (slot.level > 0) build.push(`Lv ${slot.level}`)
  const perkCount = Object.values(slot.selectedPerks).filter(Boolean).length
  if (perkCount > 0) build.push(`${perkCount} perk${perkCount > 1 ? "s" : ""}`)

  return (
    <div className="flex h-full flex-col border border-border/50">
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: color }} aria-hidden />

      <div className="flex flex-1 items-start gap-3 p-3">
        <AssetImage
          src={weaponIcon(weapon.icon, isRanged ? "weapons-ranged" : "weapons-melee")}
          alt={weapon.name}
          className="size-11 shrink-0 object-contain"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold uppercase leading-tight text-foreground">{weapon.name}</p>
          <p className="truncate text-[11px] capitalize text-muted-foreground">
            <span className={`font-medium ${rarityColor}`}>{weapon.rarity}</span>
            {" / "}
            {weapon.category}
            {isRanged && (weapon as RangedWeaponDetail).ammoType && (
              <>
                {" / "}
                {(weapon as RangedWeaponDetail).ammoType}
              </>
            )}
          </p>
          <p className="mt-1 truncate text-[11px] capitalize text-muted-foreground/80">{build.join(" / ")}</p>

          {/* Le reglage du build se fait sur la fiche de l'arme. */}
          <Link
            href={`/${locale}/weapons/${weapon.type}/${weapon.slug}`}
            className="mt-1.5 inline-block text-[11px] text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Edit build
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button size="xs" variant="ghost" onClick={() => setPickerOpen(true)} title="Change weapon">
            <Repeat className="size-3.5" />
          </Button>
          {removable && (
            <Button size="xs" variant="ghost" onClick={onClear} title="Remove weapon">
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <WeaponPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={onPick} />
    </div>
  )
}
