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

// Extrait modifier + element depuis le champ raw du venturesSeason
// Ex raw: "Scurvy Shoals             (Bouncy Husks)        Mutant Season                                  (Nature)"
// -> { modifier: "Bouncy Husks", element: "Nature", type: "Mutant Season" }
export interface ParsedSeason {
  modifier: string | null
  element: string | null
  type: string | null
}

export function parseVentureSeason(raw: string): ParsedSeason {
  const parens = Array.from(raw.matchAll(/\(([^)]+)\)/g)).map((m) => m[1].trim())
  const withoutParens = raw.replace(/\([^)]+\)/g, "").replace(/\s+/g, " ").trim()
  // Apres avoir vire les parentheses : "Scurvy Shoals Mutant Season"
  // On considere que tout ce qui est apres le premier mot multi (le name) est le type
  const parts = withoutParens.split(/\s{2,}/)
  // Apres le replace, on n'a plus de double-space, donc on split sur le premier mot et le reste
  // Plus simple : le type est le dernier "morceau" apres le name
  const tokens = withoutParens.split(/\s+/)
  // Heuristique : 2 derniers mots = type (Mutant Season, Miniboss)
  const knownTypes = ["Mutant Season", "Miniboss", "Escalation"]
  let type: string | null = null
  for (const kt of knownTypes) {
    if (withoutParens.includes(kt)) {
      type = kt
      break
    }
  }
  return {
    modifier: parens[0] ?? null,
    element: parens[parens.length - 1] ?? null,
    type,
  }
}
