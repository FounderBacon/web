"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Repeat, SlidersHorizontal, X } from "lucide-react"
import { AssetImage } from "@/components/ui/asset-image"
import { weaponIcon } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import { WeaponPicker } from "./WeaponPicker"
import { perkSummary } from "@/lib/compare/summary"
import { fmt, useCompareT } from "@/lib/compare/i18n"
import { compareEditHref } from "@/lib/compare/editLink"
import type { CompareSlotState, WeaponRef } from "@/lib/compare/useCompareSlot"
import type { Perk } from "@/lib/types/shared"
import type { RangedWeaponDetail } from "@/lib/types/weapon"

interface CompareCardProps {
  slot: CompareSlotState
  color: string
  locale: string
  onPick: (ref: WeaponRef) => void
  onClear: () => void
  removable?: boolean
  // Vrai tant qu'une colonne precedente est vide : le store compacte les
  // entrees par ordre de remplissage, donc remplir la 3e avant la 2e fait
  // apparaitre l'arme dans la mauvaise colonne au rechargement de la page.
  locked?: boolean
}

/**
 * En-tete d'une colonne du comparateur, en lecture seule.
 *
 * Le build (tier, materiau, level, perks) se regle sur la fiche de l'arme puis
 * s'ajoute au comparateur : afficher ici les selecteurs repoussait le tableau
 * de stats hors de l'ecran, alors que c'est le but de la page.
 *
 * La cellule doit rester lisible a ~110px de large (trois colonnes sur un
 * telephone) comme a ~280px sur desktop : le detail (rarete, categorie, lien
 * d'edition) n'apparait qu'a partir de md, ou il y a la place pour lui.
 */
export function CompareCard({ slot, color, locale, onPick, onClear, removable, locked }: CompareCardProps) {
  const t = useCompareT()
  const [pickerOpen, setPickerOpen] = useState(false)
  const { weapon } = slot

  if (!weapon) {
    return (
      <>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={slot.loading || locked}
          className="flex h-full min-h-24 w-full flex-col items-center justify-center gap-1.5 border border-dashed border-border/60 p-2 transition-colors hover:border-primary/50 hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-32 md:p-4"
        >
          {slot.loading ? (
            <div className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          ) : locked ? (
            <span className="text-[10px] leading-tight text-muted-foreground md:text-xs">
              {t.fillPrevious}
            </span>
          ) : (
            <>
              <Plus className="size-4 text-muted-foreground md:size-5" />
              <span className="text-[10px] leading-tight text-muted-foreground md:text-xs">
                {slot.error ? t.notFoundPick : t.addWeapon}
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
  const build: string[] = [`T${slot.tier}`]
  if (slot.hasSplit) build.push(slot.material)
  if (slot.level > 0) build.push(`Lv${slot.level}`)
  // Les perks sont nommes, pas comptes : c'est souvent la seule difference
  // entre deux colonnes portant la meme arme.
  const perks = Object.values(slot.selectedPerks).filter((p): p is Perk => p !== null)
  const perkLabel = perkSummary(perks, (count) => fmt(t.perksCount, { count }))
  if (perkLabel) build.push(perkLabel)

  return (
    <div className="group/col relative flex h-full flex-col items-center gap-1 px-1 pb-2 pt-2 text-center md:px-2">
      {/* Barre de couleur : c'est elle qu'on retrouve sur chaque barre de
          magnitude du tableau, donc le lien entre une colonne et ses valeurs. */}
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: color }} aria-hidden />

      {/* Actions discretes : visibles au survol sur desktop, toujours la au
          doigt — un controle qui n'apparait qu'au hover est inatteignable
          sur mobile. */}
      <div className="absolute right-0 top-1.5 flex items-center gap-0.5 md:opacity-0 md:transition-opacity md:group-hover/col:opacity-100 md:focus-within:opacity-100">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          title={t.changeWeapon}
          aria-label={fmt(t.changeNamed, { name: weapon.name })}
          className="p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Repeat className="size-3.5" />
        </button>
        {removable && (
          <button
            type="button"
            onClick={onClear}
            title={t.removeWeapon}
            aria-label={fmt(t.removeNamed, { name: weapon.name })}
            className="p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <AssetImage
        src={weaponIcon(weapon.icon, isRanged ? "weapons-ranged" : "weapons-melee")}
        alt={weapon.name}
        className="size-9 shrink-0 object-contain md:size-12"
      />

      {/* Hauteur reservee pour deux lignes : sans elle, une arme au nom court
          remonte tout le reste de sa colonne et les resumes de build ne
          s'alignent plus d'une colonne a l'autre. */}
      <div className="flex min-h-8 w-full items-center justify-center md:min-h-10">
        <p className="line-clamp-2 text-[11px] font-bold uppercase leading-tight text-foreground md:text-sm">
          {weapon.name}
        </p>
      </div>

      {/* Rarete et categorie : de l'identite, pas de la comparaison. On les
          retire quand la colonne est trop etroite pour les porter sans
          tronquer le nom de l'arme. */}
      <p className="hidden w-full truncate text-[11px] capitalize text-muted-foreground md:block">
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

      {/* Le build reste visible a toutes les largeurs, et sur deux lignes
          plutot que tronque : quand plusieurs colonnes portent la meme arme,
          c'est le seul texte qui les distingue — le couper a "T5 / Ore /
          Lv50..." rendait trois variantes de perk rigoureusement identiques. */}
      <p className="line-clamp-2 w-full text-[10px] capitalize leading-snug text-muted-foreground/80 md:text-[11px]">
        {build.join(" / ")}
      </p>

      {/* Le reglage du build se fait sur la fiche de l'arme. */}
      <Link
        href={compareEditHref(
          locale,
          { type: weapon.type, slug: weapon.slug },
          {
            tier: slot.tier,
            ...(slot.hasSplit && { material: slot.material }),
            ...(slot.level > 0 && { level: slot.level }),
            ...(slot.offensive > 0 && { offensive: slot.offensive }),
            perkIds: Object.entries(slot.selectedPerks).reduce<string[]>((acc, [s, perk]) => {
              if (perk) acc[Number(s)] = perk.perkId
              return acc
            }, []),
          },
        )}
        className="mt-auto inline-flex items-center gap-1 pt-1 text-[10px] text-primary underline underline-offset-2 hover:text-primary/80 md:text-[11px]"
      >
        <SlidersHorizontal className="size-3 shrink-0" />
        <span className="hidden sm:inline">{t.editBuild}</span>
        <span className="sm:hidden">{t.build}</span>
      </Link>

      <WeaponPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={onPick} />
    </div>
  )
}
