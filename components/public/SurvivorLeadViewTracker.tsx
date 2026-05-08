"use client"

import { useEffect } from "react"
import { track } from "@/lib/api/track"

export function SurvivorLeadViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    track({ type: "survivor-lead.viewed", entityType: "survivor-lead", entitySlug: slug })
  }, [slug])

  return null
}
