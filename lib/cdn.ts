const CDN_BASE = "https://cdn.founderbacon.com/icons/weapons"
const FALLBACK = `${CDN_BASE}/icon-unknown.png`

export function weaponIcon(icon: string | undefined): string {
  if (!icon) return FALLBACK
  return `${CDN_BASE}/${icon}.png`
}

export function weaponIconLarge(icon: string | undefined): string {
  if (!icon) return FALLBACK
  return `${CDN_BASE}/${icon}-l.png`
}
