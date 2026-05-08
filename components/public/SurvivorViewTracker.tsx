"use client"

import { useEffect } from "react"
import { track } from "@/lib/api/track"

export function SurvivorViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    track({ type: "survivor.viewed", entityType: "survivor", entitySlug: slug })
  }, [slug])

  return null
}
