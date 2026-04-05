import { api } from "./client"
import type { PaginatedResponse, WeaponSummary, MeleeWeaponSummary, WeaponQueryParams, MeleeQueryParams, RangedWeaponDetail, MeleeWeaponDetail } from "@/lib/types/weapon"

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
