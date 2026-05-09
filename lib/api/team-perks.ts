import { api } from "./client"

// ── Summary (liste) ──────────────────────────────────────────────
export interface TeamPerkSummary {
  _id: string
  perkId: string
  name: string
  requirements: string
  progressive: boolean
  icon: string
}

// ── Detail (single) ──────────────────────────────────────────────
export interface TeamPerkDetail extends TeamPerkSummary {
  description: string
  createdAt: string
  updatedAt: string
}

interface PaginatedTeamPerks {
  data: TeamPerkSummary[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export async function fetchTeamPerks(params: { page?: number; limit?: number } = {}): Promise<PaginatedTeamPerks> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.limit) qs.set("limit", String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return api.get<PaginatedTeamPerks>(`/v1/team-perks${suffix}`, { skipAuth: true })
}

export async function fetchTeamPerk(perkId: string): Promise<TeamPerkDetail> {
  return api.get<TeamPerkDetail>(`/v1/team-perks/${perkId}`, { skipAuth: true })
}
