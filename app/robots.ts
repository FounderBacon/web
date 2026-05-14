import type { MetadataRoute } from "next"
import { isProduction } from "@/lib/env"

export default function robots(): MetadataRoute.Robots {
  // Hors production : bloquer tout crawling pour ne pas indexer
  // staging.founderbacon.com ni les previews.
  if (!isProduction()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    }
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/*/dashboard", "/*/settings", "/*/profile"],
      },
    ],
    sitemap: "https://founderbacon.com/sitemap.xml",
  }
}
