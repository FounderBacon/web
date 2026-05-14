import type { MetadataRoute } from "next"
import { locales } from "@/lib/i18n"

const DOMAIN = "https://founderbacon.com"
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")

// Helpers de fetch tolerant : si l'API est down, on retourne une liste vide
// pour ne pas casser tout le build.

async function fetchAllSlugs(path: string, total: number): Promise<string[]> {
  if (!API_URL) return []
  try {
    const res = await fetch(`${API_URL}${path}?limit=${total}&fields=slug`)
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []).map((d: { slug: string }) => d.slug).filter(Boolean)
  } catch {
    return []
  }
}

async function fetchWeaponSlugs(): Promise<{ type: string; slug: string }[]> {
  if (!API_URL) return []
  try {
    const [ranged, melee] = await Promise.all([
      fetch(`${API_URL}/v1/weapons/ranged?limit=500&fields=slug`).then((r) => r.json()),
      fetch(`${API_URL}/v1/weapons/melee?limit=500&fields=slug`).then((r) => r.json()),
    ])
    const out: { type: string; slug: string }[] = []
    for (const w of ranged.data ?? []) out.push({ type: "ranged", slug: w.slug })
    for (const w of melee.data ?? []) out.push({ type: "melee", slug: w.slug })
    return out
  } catch {
    return []
  }
}

async function fetchChangelogSlugs(): Promise<string[]> {
  if (!API_URL) return []
  try {
    const res = await fetch(`${API_URL}/v1/bacon/changelog?limit=100`)
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []).map((d: { slug: string }) => d.slug).filter(Boolean)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [weapons, traps, heroes, survivors, survivorLeads, changelogs] = await Promise.all([
    fetchWeaponSlugs(),
    fetchAllSlugs("/v1/traps", 200),
    fetchAllSlugs("/v1/heroes", 500),
    fetchAllSlugs("/v1/survivors", 200),
    fetchAllSlugs("/v1/survivor-leads", 500),
    fetchChangelogSlugs(),
  ])

  const now = new Date()

  // Pages statiques (par locale)
  const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    { url: `${DOMAIN}/${locale}`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${DOMAIN}/${locale}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${DOMAIN}/${locale}/search/weapons`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${DOMAIN}/${locale}/search/traps`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${DOMAIN}/${locale}/search/heroes`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${DOMAIN}/${locale}/search/survivors`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${DOMAIN}/${locale}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${DOMAIN}/${locale}/roadmap`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${DOMAIN}/${locale}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ])

  // Pages dynamiques (par locale x slug)
  const dynamicPages: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    ...weapons.map((w) => ({
      url: `${DOMAIN}/${locale}/weapons/${w.type}/${w.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...traps.map((slug) => ({
      url: `${DOMAIN}/${locale}/traps/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...heroes.map((slug) => ({
      url: `${DOMAIN}/${locale}/heroes/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...survivors.map((slug) => ({
      url: `${DOMAIN}/${locale}/survivors/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...survivorLeads.map((slug) => ({
      url: `${DOMAIN}/${locale}/survivor-leads/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...changelogs.map((slug) => ({
      url: `${DOMAIN}/${locale}/changelog/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ])

  return [...staticPages, ...dynamicPages]
}
