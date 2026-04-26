import { api } from "./client"

export interface VenturesSeason {
  raw: string
  name: string
  modifier: string
  type: string
  element: string
}

export interface VentureWeek {
  _id: string
  weekId: string
  year: number
  weekNumber: number
  monthLabel: string
  weekOfMonth: number
  returnDate: string
  returnLabel: string
  eventStore: { raw: string; items: string[] } | null
  questline: { raw: string; title: string; leavesAt: string | null } | null
  ltm: { raw: string; items: string[] } | null
  eventLlama: string | null
  venturesSeason: VenturesSeason | null
  syncHash?: string
  syncedAt?: string
}

interface VenturesListResponse {
  data: VentureWeek[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function fetchCurrentVenture(): Promise<VentureWeek> {
  return api.get<VentureWeek>("/v1/bacon/ventures/current", { skipAuth: true })
}

interface VenturesQueryParams {
  year?: number
  limit?: number
  page?: number
}

export async function fetchVentures(params: VenturesQueryParams = {}): Promise<VenturesListResponse> {
  const qs = new URLSearchParams()
  if (params.year) qs.set("year", String(params.year))
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.page) qs.set("page", String(params.page))
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return api.get<VenturesListResponse>(`/v1/bacon/ventures${suffix}`, { skipAuth: true })
}

export async function fetchUpcomingVentures(count = 4): Promise<VentureWeek[]> {
  return api.get<VentureWeek[]>(`/v1/bacon/ventures/upcoming?count=${count}`, { skipAuth: true })
}

export async function fetchVentureByWeekId(weekId: string): Promise<VentureWeek> {
  return api.get<VentureWeek>(`/v1/bacon/ventures/${weekId}`, { skipAuth: true })
}

// Le name renvoye par l'API contient des espaces multiples et la categorie collee.
// Ex: "Scurvy Shoals             (Bouncy Husks)        Mutant Season"
// On extrait juste le nom du venture (avant la premiere double-space ou parenthese).
export function cleanVentureName(rawName: string): string {
  return rawName.split(/\s{2,}|\(/)[0].trim()
}
