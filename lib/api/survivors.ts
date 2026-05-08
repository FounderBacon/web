import type { Rarity } from "@/lib/types/shared"
import { api } from "./client"

// ── Summary (liste) ──────────────────────────────────────────────
export interface SurvivorSummary {
  _id: string
  survivorId: string
  slug: string
  name: string
  rarity: Rarity
  tier: number
  maxTier: number
  levelRange: { min: number; max: number }
}

// ── Detail (single) ──────────────────────────────────────────────
export interface SurvivorDetail extends SurvivorSummary {
  itemId: string
  ratingRow: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ── Query params ─────────────────────────────────────────────────
export interface SurvivorQueryParams {
  rarity?: string
  tier?: number
  page?: number
  limit?: number
}

interface PaginatedSurvivors {
  data: SurvivorSummary[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  if (entries.length === 0) return ""
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
}

export async function fetchSurvivors(params: SurvivorQueryParams = {}): Promise<PaginatedSurvivors> {
  return api.get<PaginatedSurvivors>(`/v1/survivors${toQueryString({ ...params })}`, { skipAuth: true })
}

export async function fetchSurvivor(slug: string): Promise<SurvivorDetail> {
  return api.get<SurvivorDetail>(`/v1/survivors/${slug}`, { skipAuth: true })
}
