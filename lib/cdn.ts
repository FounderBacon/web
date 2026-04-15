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
