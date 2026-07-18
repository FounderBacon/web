import { api } from "./client"

export type HeroClass = "soldier" | "constructor" | "ninja" | "outlander"

// ── Summary (liste) ──────────────────────────────────────────────
export interface HeroPerkSummary {
  _id: string
  perkId: string
  name: string
  heroClass: HeroClass
  icon: string
}

// ── Detail (single) ──────────────────────────────────────────────
export interface HeroPerkDetail extends HeroPerkSummary {
  standardDescription: string
  commanderDescription: string
  createdAt: string
  updatedAt: string
}

export interface HeroPerkQueryParams {
  heroClass?: HeroClass
  page?: number
  limit?: number
}

interface PaginatedHeroPerks {
  data: HeroPerkSummary[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  if (entries.length === 0) return ""
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
}

export async function fetchHeroPerks(params: HeroPerkQueryParams = {}): Promise<PaginatedHeroPerks> {
  return api.get<PaginatedHeroPerks>(`/v1/hero-perks${toQueryString({ ...params })}`, { skipAuth: true })
}

export async function fetchHeroPerk(perkId: string): Promise<HeroPerkDetail> {
  return api.get<HeroPerkDetail>(`/v1/hero-perks/${perkId}`, { skipAuth: true })
}
