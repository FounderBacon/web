"use client"

import { useEffect } from "react"
import { track } from "@/lib/api/track"

// Composant qui declenche un seul track view au mount, sans rendu visuel.
export function HeroViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    track({ type: "hero.viewed", entityType: "hero", entitySlug: slug })
  }, [slug])

  return null
}
