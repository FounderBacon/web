import type { Rarity, Element, PaginatedResponse, PerkSlot, CraftingIngredient, LevelRange, TierData } from "./shared"

// ── Types specifiques pieges ─────────────────────────────────────
export type TrapPlacement = "ceiling" | "floor" | "wall"
export type TrapTarget = "hostile" | "friendly"

// ── Stats ────────────────────────────────────────────────────────
export interface TrapStats {
  damage: number
  dps: number
  impactDamage: number
  envDamage: number
  critChance: number
  critMultiplier: number
  vulnerabilityMultiplier: number
  armTime: number
  fireDelay: number
  damageDelay: number
  reloadTime: number
  durability: number
  durabilityPerUse: number
  totalActivations: number
  knockback?: number
  stunTime?: number
  stunScale?: number
}

// ── Summary (liste) ──────────────────────────────────────────────
export interface TrapSummary {
  slug: string
  name: string
  placement: TrapPlacement
  trapType: string
  target: TrapTarget
  rarity: Rarity
  element: Element
  icon: string
}

// ── Detail (single) ──────────────────────────────────────────────
export interface TrapDetail extends TrapSummary {
  trapId: string
  itemId: string
  type: "trap"
  description: string
  maxTier: number
  perkSlots: PerkSlot[]
  tiers: Record<string, TierData>
  createdAt: string
  updatedAt: string
}

// ── Query params ─────────────────────────────────────────────────
export interface TrapQueryParams {
  search?: string
  placement?: string
  trapType?: string
  target?: string
  rarity?: string
  element?: string
  page?: number
  limit?: number
  sort?: string
  fields?: string
}

export type { Rarity, Element, PaginatedResponse, PerkSlot, CraftingIngredient, LevelRange, TierData }
