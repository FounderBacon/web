import type { PaginatedResponse } from "./shared"

export interface IPerk {
  perkId: string
  name: string
  description: string
  rarity: string
  type: string
  category: string
}

export interface PerkQueryParams {
  search?: string
  rarity?: string
  type?: string
  category?: string
  page?: number
  limit?: number
  sort?: string
  fields?: string
}

export type { PaginatedResponse }
