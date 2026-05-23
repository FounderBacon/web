// Types pour les reponses backend avec ?groupByName=true.
// Le back groupe les items par nom et retourne les variantes par rarete
// dans un array trie ASCENDING (common -> mythic). Le champ maxRarity
// permet de retrouver la variante "principale" sans recalculer.

import type { Rarity, Element } from "./shared"
import type { HeroClass } from "@/lib/api/heroes"

// ── Variant generique ────────────────────────────────────────────

export interface Variant {
  slug: string
  rarity: Rarity
  icon: string
  iconUrl: string
  iconUrlLarge: string
}

export type WeaponVariant = Variant & { isFounders: boolean }

// ── Generic group ────────────────────────────────────────────────

interface BaseGrouped<TVariant extends Variant> {
  name: string
  baseSlug: string
  maxRarity: Rarity
  variants: TVariant[]
}

// ── Heroes ───────────────────────────────────────────────────────

export interface HeroGroupedSummary extends BaseGrouped<Variant> {
  heroClass: HeroClass
  subclass: string
}

// ── Traps ────────────────────────────────────────────────────────

export interface TrapGroupedSummary extends BaseGrouped<Variant> {
  placement: string
  trapType: string
  target: string
  element: Element
}

// ── Weapons ──────────────────────────────────────────────────────

export interface RangedWeaponGroupedSummary extends BaseGrouped<WeaponVariant> {
  category: string
  element: Element
  ammoType: string
  weaponSet: string | null
}

export interface MeleeWeaponGroupedSummary extends BaseGrouped<WeaponVariant> {
  category: string
  meleeClass: string
  element: Element
  weaponSet: string | null
}

// ── Helper : trouve la variante max ──────────────────────────────
// Les variants sont tries ASC dans la reponse API, donc la max est
// la derniere. On fallback sur le filtre par maxRarity pour la safety.
export function getMaxVariant<TVariant extends Variant>(
  group: { maxRarity: Rarity; variants: TVariant[] },
): TVariant {
  const match = group.variants.find((v) => v.rarity === group.maxRarity)
  return match ?? group.variants[group.variants.length - 1]
}
