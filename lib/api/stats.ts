import { api } from "./client"
import type { TrackEntityType } from "./track"

export type Period = "7d" | "30d" | "all"

// Format flat de l'API : champs communs + champs specifiques selon entityType
export interface PopularItem {
  entitySlug: string
  views: number
  slug: string
  name: string
  rarity: string
  icon?: string
  // Champs optionnels selon le type
  category?: string
  element?: string
  weaponSet?: string | null
  meleeClass?: string
  placement?: string
  trapType?: string
  heroClass?: string
  subclass?: string
  stars?: number
  tier?: string
  squadType?: string
  personality?: string
  isNamed?: boolean
  isUnique?: boolean
}

export async function fetchPopular(
  type: TrackEntityType,
  period: Period = "7d",
  limit = 10,
): Promise<PopularItem[]> {
  const qs = `?type=${type}&period=${period}&limit=${limit}`
  return api.get<PopularItem[]>(`/v1/stats/popular${qs}`, { skipAuth: true })
}

// L'endpoint global merge tous les types et tri par views desc.
// Les items dont l'entite n'existe plus en base n'ont que entitySlug/views/entityType.
export interface PopularGlobalItem {
  entitySlug: string
  views: number
  entityType: TrackEntityType
  // Champs presents uniquement si l'entite est encore liee a une fiche
  slug?: string
  name?: string
  rarity?: string
  icon?: string
  category?: string
  element?: string
  weaponSet?: string | null
  meleeClass?: string
  placement?: string
  trapType?: string
  heroClass?: string
  subclass?: string
  stars?: number
  tier?: string
  squadType?: string
  personality?: string
  isNamed?: boolean
  isUnique?: boolean
}

export async function fetchPopularGlobal(
  period: Period = "7d",
  perType = 3,
): Promise<PopularGlobalItem[]> {
  const qs = `?period=${period}&perType=${perType}`
  return api.get<PopularGlobalItem[]>(`/v1/stats/popular/global${qs}`, { skipAuth: true })
}
