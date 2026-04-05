import type { MetadataRoute } from "next"
import { locales } from "@/lib/i18n"

const DOMAIN = "https://founderbacon.com"
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.founderbacon.com"

async function fetchWeaponSlugs(): Promise<{ type: string; slug: string }[]> {
  const slugs: { type: string; slug: string }[] = []

  try {
    const [ranged, melee] = await Promise.all([
      fetch(`${API_URL}/v1/weapons/ranged?limit=100&fields=slug`).then((r) => r.json()),
      fetch(`${API_URL}/v1/weapons/melee?limit=100&fields=slug`).then((r) => r.json()),
    ])

    for (const w of ranged.data ?? []) slugs.push({ type: "ranged", slug: w.slug })
    for (const w of melee.data ?? []) slugs.push({ type: "melee", slug: w.slug })
  } catch {
    // Fallback : sitemap sans les armes si l'API est down
  }

  return slugs
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const weaponSlugs = await fetchWeaponSlugs()

  return [
    ...locales.map((locale) => ({
      url: `${DOMAIN}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    })),
    ...locales.map((locale) => ({
      url: `${DOMAIN}/${locale}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...locales.flatMap((locale) =>
      weaponSlugs.map((w) => ({
        url: `${DOMAIN}/${locale}/weapons/${w.type}/${w.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
    ),
    ...locales.map((locale) => ({
      url: `${DOMAIN}/${locale}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ]
}
