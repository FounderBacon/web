import type { Rarity, Element, PaginatedResponse, PerkSlot, Perk, CraftingIngredient, LevelRange, TierData, TierSplit, TierEntry } from "./shared"

// ── Types specifiques armes ─────────────────────────────────────
export type WeaponCategory = "assault" | "launcher" | "pistol" | "shotgun" | "smg" | "sniper"
export type MeleeCategory = "sword" | "hardware" | "spear" | "scythe" | "axe" | "club"
export type AmmoType = "light" | "medium" | "heavy" | "shells" | "energy" | "rockets"
export type MeleeClass = "edged" | "blunt" | "piercing" | "scythe" | "axe" | "club"

// ── Stats ────────────────────────────────────────────────────────
export interface RangedWeaponStats {
  damage: number
  dps: number
  impactDamage: number
  envDamage: number
  critChance: number
  critMultiplier: number
  headshotMultiplier: number
  vulnerabilityMultiplier: number
  firingRate: number
  fireMode: string
  clipSize: number
  reloadTime: number
  reloadType: string
  maxSpareAmmo: number
  ammoCost: number
  spread: number
  spreadADS: number
  standingStillSpreadMult: number
  recoilVertical: number
  recoilHorizontal: number
  recoilADSMultiplier: number
  rangePB: number
  rangeMid: number
  rangeLong: number
  rangeMax: number
  isHitscan: boolean
  durability: number
  durabilityPerUse: number
  totalShots: number
  projectileVelocity?: number
  burstFiringRate?: number
  pellets?: number
  damageMid?: number
  damageLong?: number
  knockback?: number
  stunTime?: number
  overheatMaxValue?: number
  overheatHeatingValue?: number
  overheatCoolingValue?: number
  minChargeTime?: number
  maxChargeTime?: number
}

export interface MeleeWeaponStats {
  damage: number
  dps: number
  impactDamage: number
  envDamage: number
  critChance: number
  critMultiplier: number
  vulnerabilityMultiplier: number
  attackSpeed: number
  swingTime: number
  swingPlaySpeed: number
  range: number
  coneAngle: number
  conePitch: number
  buildingRange2D: number
  buildingRangeZ: number
  weakSpotRange: number
  knockback: number
  stunTime: number
  stunScale: number
  durability: number
  durabilityPerUse: number
  totalHits: number
}

// ── Summaries (liste) ────────────────────────────────────────────
export interface WeaponSummary {
  slug: string
  name: string
  category: string
  rarity: Rarity
  element: Element
  ammoType?: AmmoType
  weaponSet: string | null
  icon: string
  isFounders: boolean
}

export interface MeleeWeaponSummary {
  slug: string
  name: string
  category: string
  meleeClass: string
  rarity: Rarity
  element: Element
  weaponSet: string | null
  icon: string
  isFounders: boolean
}

// ── Details (single) ─────────────────────────────────────────────
export interface RangedWeaponDetail extends WeaponSummary {
  weaponId: string
  itemId: string
  type: "ranged"
  description: string
  isVindertech: boolean
  maxTier: number
  perkSlots: PerkSlot[]
  tiers: Record<string, TierEntry>
  createdAt: string
  updatedAt: string
}

export interface MeleeWeaponDetail extends MeleeWeaponSummary {
  weaponId: string
  itemId: string
  type: "melee"
  description: string
  isVindertech: boolean
  maxTier: number
  perkSlots: PerkSlot[]
  comboMultipliers: Record<string, Record<string, number>>
  tiers: Record<string, TierEntry>
  createdAt: string
  updatedAt: string
}

export type WeaponDetail = RangedWeaponDetail | MeleeWeaponDetail

// ── Query params ─────────────────────────────────────────────────
export interface WeaponQueryParams {
  search?: string
  category?: string
  rarity?: string
  element?: string
  ammoType?: string
  weaponSet?: string
  isFounders?: boolean
  isVindertech?: boolean
  page?: number
  limit?: number
  sort?: string
  fields?: string
}

export interface MeleeQueryParams {
  search?: string
  category?: string
  meleeClass?: string
  rarity?: string
  element?: string
  weaponSet?: string
  isFounders?: boolean
  isVindertech?: boolean
  page?: number
  limit?: number
  sort?: string
  fields?: string
}

// Re-export shared types
export type { Rarity, Element, PaginatedResponse, PerkSlot, Perk, CraftingIngredient, LevelRange, TierData, TierSplit, TierEntry }
export { isTierSplit } from "./shared"
