"use client"

import { Check, GitCompareArrows } from "lucide-react"
import { fmt, useCompareT } from "@/lib/compare/i18n"
import { MAX_COMPARE, useCompare } from "@/lib/compare/store"
import { useCompareUi } from "@/lib/compare/ui"
import type { WeaponRef } from "@/lib/compare/useCompareSlot"

interface CompareToggleProps {
  weaponRef: WeaponRef
  name: string
  rarity?: string
  className?: string
}

/**
 * Ajout / retrait d'une arme du comparateur depuis une carte de liste.
 *
 * Avant, on ne pouvait alimenter le comparateur que depuis la fiche d'une arme :
 * comparer trois armes obligeait a ouvrir trois pages, alors que c'est dans la
 * liste qu'on les survole. L'arme est ajoutee avec son build par defaut — le
 * reglage fin reste a faire via "Edit build".
 *
 * Le bouton est un frere de la carte, jamais un enfant : la carte est un lien,
 * et un bouton imbrique dans un lien est invalide en HTML et declenche la
 * navigation au clic.
 */
export function CompareToggle({ weaponRef, name, rarity, className = "" }: CompareToggleProps) {
  const t = useCompareT()
  const add = useCompare((s) => s.add)
  const entries = useCompare((s) => s.entries)

  const indexes = entries.flatMap((e, i) =>
    e.ref.type === weaponRef.type && e.ref.slug === weaponRef.slug ? [i] : [],
  )
  const inCompare = indexes.length > 0
  // Plusieurs builds de cette arme : la carte ne sait pas lequel retirer, le
  // popup du comparateur, si (une croix par colonne).
  const several = indexes.length > 1
  const full = !inCompare && entries.length >= MAX_COMPARE

  function toggle() {
    if (several) {
      useCompareUi.getState().setQuickOpen(true)
    } else if (inCompare) {
      useCompare.getState().removeAt(indexes[0])
    } else {
      add({ ref: weaponRef, init: {}, name, ...(rarity && { rarity }) })
    }
  }

  const label = several
    ? fmt(t.cardManage, { name, count: indexes.length })
    : inCompare
    ? fmt(t.cardRemove, { name })
    : full
      ? t.cardFull
      : fmt(t.cardAdd, { name })

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={full}
      title={label}
      aria-label={label}
      aria-pressed={inCompare}
      className={`relative flex size-7 items-center justify-center border backdrop-blur-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        inCompare
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/60 bg-background/80 text-muted-foreground hover:border-primary hover:text-foreground"
      } ${className}`}
    >
      {inCompare ? <Check className="size-3.5" /> : <GitCompareArrows className="size-3.5" />}
      {several && (
        <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-background text-[9px] font-bold text-foreground">
          {indexes.length}
        </span>
      )}
    </button>
  )
}
