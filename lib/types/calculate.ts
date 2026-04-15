import type { Material } from "./shared"

// ── Params envoyes au back ──────────────────────────────────────

export interface CalculateParams {
  tier: string
  material: Material
  level: number
  offensive: number
  perkIds: string[]
}

// ── Reponse du back ─────────────────────────────────────────────

export interface AppliedBonuses {
  damage: number
  critDamage: number
  critChance: number
  headshot: number
  fireRate: number
  reloadSpeed: number
  magazineSize: number
  impact: number
  durability: number
  level: number
  offensive: number
}

export interface CalculatedStats {
  damage: number
  dps: number
  critDps: number
  avgDps: number
  headshotDamage: number
  headshotDps: number
  critHeadshot: number
  impactDamage: number
  envDamage: number
  critChance: number
  critDamageMultiplier: number
  headshotMultiplier: number
  firingRate: number
  fireMode: string
  clipSize: number
  reloadTime: number
  reloadType: string
  maxSpareAmmo: number
  ammoCost: number
  spread: number
  spreadADS: number
  rangePB: number
  rangeMid: number
  rangeLong: number
  rangeMax: number
  isHitscan: boolean
  durability: number
  durabilityPerUse: number
  totalShots: number
  appliedBonuses: AppliedBonuses
  // Stats melee (optionnels)
  attackSpeed?: number
  swingTime?: number
  swingPlaySpeed?: number
  range?: number
  coneAngle?: number
  conePitch?: number
  knockback?: number
  stunTime?: number
  totalHits?: number
}

export interface CalculatedWeaponInfo {
  name: string
  slug: string
  type: "ranged" | "melee"
  rarity: string
  category: string
  icon: string
}

export interface CalculatedResponse {
  weapon: CalculatedWeaponInfo
  tier: string
  material: string
  levelRange: { min: number; max: number }
  stats: CalculatedStats
}
