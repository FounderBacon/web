import { api } from "./client"
import type { PaginatedResponse, TrapSummary, TrapDetail, TrapQueryParams, TrapPlacement } from "@/lib/types/trap"
import type { AppliedBonuses } from "@/lib/types/calculate"

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  if (entries.length === 0) return ""
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
}

// ── Listes ────────────────────────────────────────────────
export async function fetchTraps(params: TrapQueryParams = {}): Promise<PaginatedResponse<TrapSummary>> {
  return api.get<PaginatedResponse<TrapSummary>>(`/v1/traps${toQueryString({ ...params })}`, { skipAuth: true })
}

export async function fetchTrapsByPlacement(placement: TrapPlacement, params: Omit<TrapQueryParams, "placement"> = {}): Promise<PaginatedResponse<TrapSummary>> {
  return api.get<PaginatedResponse<TrapSummary>>(`/v1/traps/${placement}${toQueryString({ ...params })}`, { skipAuth: true })
}

// ── Detail ────────────────────────────────────────────────
export async function fetchTrap(slug: string): Promise<TrapDetail> {
  return api.get<TrapDetail>(`/v1/traps/${slug}`, { skipAuth: true })
}

// ── Calculator ────────────────────────────────────────────
export interface TrapCalculateParams {
  tier: string
  level: number
  perkIds: string[]
  offensive: number
}

export interface TrapCalculatedStats {
  damage: number
  dps: number
  critDps: number
  avgDps: number
  impactDamage: number
  envDamage: number
  critChance: number
  critDamageMultiplier: number
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
  appliedBonuses: AppliedBonuses
}

export interface TrapCalculatedInfo {
  name: string
  slug: string
  type: "trap"
  rarity: string
  placement: TrapPlacement
  icon: string
}

export interface TrapCalculatedResponse {
  trap: TrapCalculatedInfo
  tier: string
  levelRange: { min: number; max: number }
  stats: TrapCalculatedStats
}

export async function calculateTrapStats(slug: string, params: TrapCalculateParams): Promise<TrapCalculatedResponse> {
  return api.post<TrapCalculatedResponse>(`/v1/traps/calculate/${slug}`, params, { skipAuth: true })
}
