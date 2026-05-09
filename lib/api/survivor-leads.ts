import type { Rarity } from "@/lib/types/shared"
import { api } from "./client"

// ── Summary (liste) ──────────────────────────────────────────────
export interface SurvivorLeadSummary {
  _id: string
  leadId: string
  slug: string
  name: string
  squadType: string
  personality: string | null
  gender: string | null
  rarity: Rarity
  tier: number
  maxTier: number
  levelRange: { min: number; max: number }
  isUnique: boolean
  isNamed: boolean
  icon: string
  iconUrl: string
  iconUrlLarge?: string
}

// ── Detail (single) ──────────────────────────────────────────────
export interface SurvivorLeadDetail extends SurvivorLeadSummary {
  itemId: string
  description: string
  ratingRow: string
  matchingPersonalityBonus: number
  mismatchingPersonalityPenalty: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ── Query params ─────────────────────────────────────────────────
export interface SurvivorLeadQueryParams {
  squadType?: string
  personality?: string
  rarity?: string
  tier?: number
  isNamed?: boolean
  isUnique?: boolean
  page?: number
  limit?: number
}

interface PaginatedSurvivorLeads {
  data: SurvivorLeadSummary[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  if (entries.length === 0) return ""
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
}

export async function fetchSurvivorLeads(params: SurvivorLeadQueryParams = {}): Promise<PaginatedSurvivorLeads> {
  return api.get<PaginatedSurvivorLeads>(`/v1/survivor-leads${toQueryString({ ...params })}`, { skipAuth: true })
}

export async function fetchSurvivorLead(slug: string): Promise<SurvivorLeadDetail> {
  return api.get<SurvivorLeadDetail>(`/v1/survivor-leads/${slug}`, { skipAuth: true })
}
