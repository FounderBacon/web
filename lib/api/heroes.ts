import type { Rarity } from "@/lib/types/shared"
import { api } from "./client"

export type HeroClass = "soldier" | "constructor" | "ninja" | "outlander"

export interface HeroPerk {
  name: string
  description: string
  magnitude: number | null
}

export interface HeroAbilityStats {
  cooldown?: number
  cost?: number
  duration?: number
  attackSpeed?: number
  fireRate?: number
  radius?: number
  weaponDamage?: number
}

export interface HeroAbility {
  name: string
  description: string
  element: string
  damageType: string
  damageMultiplier: number | null
  stats: HeroAbilityStats
}

export interface HeroTier {
  tier: number
  levelRange: { min: number; max: number }
}

// ── Summary (liste) ──────────────────────────────────────────────
export interface HeroSummary {
  _id: string
  slug: string
  name: string
  heroClass: HeroClass
  subclass: string
  rarity: Rarity
  icon: string
  iconUrl: string
  iconUrlLarge: string
}

// ── Detail (single) ──────────────────────────────────────────────
export interface HeroDetail extends HeroSummary {
  heroId: string
  itemId: string
  type: string
  description: string
  gender: string
  stars: number
  statLine: string
  tiers: Record<string, HeroTier>
  commanderPerk: HeroPerk | null
  standardPerk: HeroPerk | null
  teamPerk: HeroPerk | null
  abilities: HeroAbility[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ── Query params ─────────────────────────────────────────────────
export interface HeroQueryParams {
  search?: string
  heroClass?: HeroClass
  subclass?: string
  rarity?: string
  page?: number
  limit?: number
  sort?: string
}

interface PaginatedHeroes {
  data: HeroSummary[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  if (entries.length === 0) return ""
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
}

export async function fetchHeroes(params: HeroQueryParams = {}): Promise<PaginatedHeroes> {
  return api.get<PaginatedHeroes>(`/v1/heroes${toQueryString({ ...params })}`, { skipAuth: true })
}

export async function fetchHeroesByClass(
  heroClass: HeroClass,
  params: Omit<HeroQueryParams, "heroClass"> = {},
): Promise<PaginatedHeroes> {
  return api.get<PaginatedHeroes>(`/v1/heroes/${heroClass}${toQueryString({ ...params })}`, { skipAuth: true })
}

export async function fetchHero(slug: string): Promise<HeroDetail> {
  return api.get<HeroDetail>(`/v1/heroes/${slug}`, { skipAuth: true })
}
