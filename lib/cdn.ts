import type { TrackEntityType } from "@/lib/api/track"

const CDN_BASE = "https://cdn.founderbacon.com/icons"
export const UNKNOWN_ICON = `${CDN_BASE}/utils/unknown.png`
const FALLBACK = UNKNOWN_ICON

export type AssetCategory = "weapons-ranged" | "weapons-melee" | "traps"

export function weaponIcon(icon: string | undefined, category: AssetCategory): string {
  if (!icon) return FALLBACK
  return `${CDN_BASE}/${category}/${icon}.png`
}

export function weaponIconLarge(icon: string | undefined, category: AssetCategory): string {
  if (!icon) return FALLBACK
  return `${CDN_BASE}/${category}/${icon}-l.png`
}

// Mapping entity type -> dossier CDN. null = pas d'asset disponible.
const ENTITY_FOLDER: Record<TrackEntityType, string | null> = {
  "weapon-ranged": "weapons-ranged",
  "weapon-melee": "weapons-melee",
  trap: "traps",
  hero: "heroes",
  survivor: null,
  "survivor-lead": "survivors-lead",
}

export function entityIcon(entityType: TrackEntityType, icon: string | undefined): string {
  const folder = ENTITY_FOLDER[entityType]
  if (!folder || !icon) return FALLBACK
  return `${CDN_BASE}/${folder}/${icon}.png`
}

// Convertit un nom d'ability en slug url-safe pour le CDN.
// Ex: "Lefty and Righty" -> "lefty-and-righty"
//     "Goin' Commando!!!" -> "goin-commando"
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['‘’]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

// CDN folders : "perks", "team-perks", "abilities"
export function perkIcon(name: string | undefined): string {
  if (!name) return FALLBACK
  const slug = nameToSlug(name)
  if (!slug) return FALLBACK
  return `${CDN_BASE}/perks/${slug}.png`
}

export function teamPerkIcon(name: string | undefined): string {
  if (!name) return FALLBACK
  const slug = nameToSlug(name)
  if (!slug) return FALLBACK
  return `${CDN_BASE}/team-perks/${slug}.png`
}

export function abilityIcon(name: string | undefined): string {
  if (!name) return FALLBACK
  const slug = nameToSlug(name)
  if (!slug) return FALLBACK
  return `${CDN_BASE}/abilities/${slug}.png`
}

