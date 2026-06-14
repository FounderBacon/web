import type { Rarity, PaginatedResponse } from "@/lib/types/shared"
import type { HeroGroupedSummary } from "@/lib/types/grouped"
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
  stats?: HeroAbilityStats
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
  // Filtre par terme de boost dans les perks/abilities (commander, standard, team).
  // Ex: "minigun" -> tous les heros dont un perk mentionne minigun.
  // Contraintes API : max 100 chars, regex ^[A-Za-z0-9 _-]+$ (sinon 400).
  boosts?: string
  heroClass?: HeroClass
  subclass?: string
  rarity?: string
  page?: number
  limit?: number
  sort?: string
}

// Regex de validation cote API. Le front filtre les caracteres a la saisie
// pour eviter d'envoyer un input invalide qui renverrait un 400.
export const BOOSTS_VALID_CHARS = /^[A-Za-z0-9 _-]+$/
export const BOOSTS_MAX_LENGTH = 100

// Strip les caracteres non autorises et trim. Renvoie une string safe a envoyer.
export function sanitizeBoostsInput(raw: string): string {
  return raw
    .replace(/[^A-Za-z0-9 _-]/g, "")
    .slice(0, BOOSTS_MAX_LENGTH)
    .trim()
}

// Suggestions partagees entre HeroesView (sidebar) et SearchDialog (global).
// Subset des termes recommandes par le back, focus sur les plus populaires.
export const BOOST_SUGGESTIONS = [
  "assault",
  "sniper",
  "shotgun",
  "sword",
  "crit damage",
  "headshot",
  "reload",
] as const

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

// Variante groupee par nom (anti-duplication des rarites cote search).
// Le back trie les variants ASC par rarete et fournit maxRarity au niveau groupe.
export async function fetchHeroesGrouped(
  params: HeroQueryParams = {},
): Promise<PaginatedResponse<HeroGroupedSummary>> {
  return api.get<PaginatedResponse<HeroGroupedSummary>>(
    `/v1/heroes${toQueryString({ ...params, groupByName: true })}`,
    { skipAuth: true },
  )
}

export async function fetchHero(slug: string): Promise<HeroDetail> {
  return api.get<HeroDetail>(`/v1/heroes/${slug}`, { skipAuth: true })
}
