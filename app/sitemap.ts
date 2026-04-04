import type { MetadataRoute } from "next"
import { locales } from "@/lib/i18n"

const DOMAIN = "https://founderbacon.com"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...locales.map((locale) => ({
      url: `${DOMAIN}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    })),
    ...locales.map((locale) => ({
      url: `${DOMAIN}/${locale}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ]
}
