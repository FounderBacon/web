import type { MetadataRoute } from "next"
import { isProduction } from "@/lib/env"

const DOMAIN = "https://founderbacon.com"

// Bots d'entrainement / scraping LLM. Respectent generalement robots.txt.
const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "Google-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "Meta-ExternalAgent",
  "FacebookBot",
  "cohere-ai",
  "Diffbot",
  "ImagesiftBot",
  "omgili",
  "DataForSeoBot",
  "AI2Bot",
  "Applebot-Extended",
]

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
        disallow: [
          // Routes authentifiees (compte utilisateur)
          "/*/dashboard",
          "/*/settings",
          "/*/profile",
          "/*/login",
          "/*/auth/",
          // API Next.js internes (proxy-image, etc.)
          "/api/",
        ],
      },
      // Bloquer les scrapers IA (training LLMs)
      {
        userAgent: AI_BOTS,
        disallow: "/",
      },
    ],
    sitemap: `${DOMAIN}/sitemap.xml`,
    host: DOMAIN,
  }
}
