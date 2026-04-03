import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/settings", "/profile"],
      },
    ],
    sitemap: "https://founderbacon.com/sitemap.xml",
  }
}
