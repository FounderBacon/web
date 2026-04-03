import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FounderBacon",
    short_name: "FounderBacon",
    description:
      "The first free, open REST API for Fortnite: Save the World.",
    start_url: "/",
    display: "standalone",
    background_color: "#28253E",
    theme_color: "#861AA0",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  }
}
