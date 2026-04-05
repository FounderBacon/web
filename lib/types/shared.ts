// ── Types communs (synchro avec founderbacon-api) ────────────────

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic"
export type Element = "physical" | "energy" | "fire" | "water" | "nature"
export type DisplayTier = "copper" | "silver" | "malachite" | "obsidian" | "shadowshard" | "brightcore" | "sunbeam"
export type Material = "ore" | "crystal"

// ── Perk Slots ───────────────────────────────────────────────────

export interface PerkSlot {
  slot: number
  unlockLevel: number
  unlockRarity: string
  isRespeccable: boolean
  availablePerks: Perk[]
}

export interface Perk {
  _id: string
  perkId: string
  name: string
  description: string
  rarity: string
  type: string
  category: string
}

// ── Crafting ─────────────────────────────────────────────────────

export interface CraftingIngredient {
  name: string
  quantity: number
}

export interface LevelRange {
  min: number
  max: number
}

// ── Tiers ────────────────────────────────────────────────────────

export interface TierData {
  displayTier: string
  levelRange: LevelRange
  stats: Record<string, unknown>
  crafting: CraftingIngredient[]
  recycle: CraftingIngredient[]
  evolution?: CraftingIngredient[]
}

export interface TierSplit {
  ore: TierData
  crystal: TierData
}

export type TierEntry = TierData | TierSplit

export function isTierSplit(entry: TierEntry): entry is TierSplit {
  return "ore" in entry && "crystal" in entry
}

// ── Pagination ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
