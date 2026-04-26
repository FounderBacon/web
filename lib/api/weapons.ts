import { api } from "./client"
import type { PaginatedResponse, WeaponSummary, MeleeWeaponSummary, WeaponQueryParams, MeleeQueryParams, RangedWeaponDetail, MeleeWeaponDetail, WeaponDetail } from "@/lib/types/weapon"
import type { CalculateParams, CalculatedResponse } from "@/lib/types/calculate"

// ── Counters (compteurs globaux par categorie) ──────────
export interface ItemCounters {
  melee: number
  ranged: number
  trap: number
  hero?: number
  survivor?: number
  worker?: number
}

export async function fetchCounters(): Promise<ItemCounters> {
  return api.get<ItemCounters>(`/v1/counters`, { skipAuth: true })
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  if (entries.length === 0) return ""
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
}

export async function fetchRangedWeapons(params: WeaponQueryParams = {}): Promise<PaginatedResponse<WeaponSummary>> {
  return api.get<PaginatedResponse<WeaponSummary>>(`/v1/weapons/ranged${toQueryString({ ...params })}`, { skipAuth: true })
}

export async function fetchMeleeWeapons(params: MeleeQueryParams = {}): Promise<PaginatedResponse<MeleeWeaponSummary>> {
  return api.get<PaginatedResponse<MeleeWeaponSummary>>(`/v1/weapons/melee${toQueryString({ ...params })}`, { skipAuth: true })
}

export async function fetchRangedWeapon(slug: string): Promise<RangedWeaponDetail> {
  return api.get<RangedWeaponDetail>(`/v1/weapons/ranged/${slug}`, { skipAuth: true })
}

export async function fetchMeleeWeapon(slug: string): Promise<MeleeWeaponDetail> {
  return api.get<MeleeWeaponDetail>(`/v1/weapons/melee/${slug}`, { skipAuth: true })
}

interface RandomWeaponItem {
  type: "ranged" | "melee"
  slug: string
  name: string
  rarity: string
  element: string
  icon: string
}

interface RandomResponse {
  data: RandomWeaponItem[]
  count: number
}

export async function calculateWeaponStats(
  type: "ranged" | "melee",
  slug: string,
  params: CalculateParams,
): Promise<CalculatedResponse> {
  return api.post<CalculatedResponse>(`/v1/weapons/${type}/calculate/${slug}`, params, { skipAuth: true })
}

export async function fetchRandomWeapon(): Promise<WeaponDetail> {
  const res = await api.get<RandomResponse>("/v1/random?type=weapons", { skipAuth: true })
  const item = res.data[0]
  if (!item) throw new Error("No random weapon returned")

  return item.type === "melee"
    ? fetchMeleeWeapon(item.slug)
    : fetchRangedWeapon(item.slug)
}
