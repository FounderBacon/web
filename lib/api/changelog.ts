import { api } from "./client"

export type ChangelogCategory = "added" | "changed" | "deprecated" | "removed" | "fixed" | "security"

export interface ChangelogItem {
  title: string
  description: string
  category: ChangelogCategory
  scope: string
  endpoints: string[]
  tags: string[]
}

export interface ChangelogEntry {
  _id: string
  slug?: string
  version: string
  releaseDate: string
  title: string
  summary: string
  scope: string[]
  breaking: boolean
  migrationNotes: string | null
  items: ChangelogItem[]
  isPublic: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

// Slug utilise dans les URLs : /changelog/:slug
// Format API : "2026-04-19" (date du jour) ou "2026-04-19-1" si plusieurs releases le meme jour.
// Fallback sur la date si l'API n'expose pas encore le champ slug.
export function entrySlug(entry: ChangelogEntry): string {
  return entry.slug ?? entry.releaseDate.split("T")[0]
}

interface ChangelogResponse {
  data: ChangelogEntry[]
  meta: { limit: number; offset: number }
}

export async function fetchChangelog(params: { limit?: number; offset?: number } = {}): Promise<ChangelogResponse> {
  const qs = new URLSearchParams()
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.offset) qs.set("offset", String(params.offset))
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return api.get<ChangelogResponse>(`/v1/bacon/changelog${suffix}`, { skipAuth: true })
}

export async function fetchChangelogLatest(): Promise<ChangelogEntry> {
  return api.get<ChangelogEntry>("/v1/bacon/changelog/latest", { skipAuth: true })
}

export async function fetchChangelogBySlug(slug: string): Promise<ChangelogEntry> {
  return api.get<ChangelogEntry>(`/v1/bacon/changelog/${slug}`, { skipAuth: true })
}
