import { api } from "./client"
import type { HeroClass } from "./hero-perks"

export interface ClassPerkSummary {
  _id: string
  perkId: string
  name: string
  heroClass: HeroClass
  icon: string
}

export interface ClassPerkDetail extends ClassPerkSummary {
  description: string
  createdAt: string
  updatedAt: string
}

interface PaginatedClassPerks {
  data: ClassPerkSummary[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export async function fetchClassPerks(): Promise<PaginatedClassPerks> {
  return api.get<PaginatedClassPerks>("/v1/class-perks", { skipAuth: true })
}

export async function fetchClassPerk(perkId: string): Promise<ClassPerkDetail> {
  return api.get<ClassPerkDetail>(`/v1/class-perks/${perkId}`, { skipAuth: true })
}
