// Types et constantes UI pour la roadmap. Donnees fetchees via /v1/bacon/roadmap
// (cf. lib/api/roadmap.ts).

export type RoadmapStatus = "live" | "in-progress" | "planned"

export interface RoadmapItem {
  label: string
  done: boolean
}

export interface RoadmapMilestone {
  version: string
  title: string
  status: RoadmapStatus
  color: string
  items: RoadmapItem[]
}

export const STATUS_BADGE: Record<RoadmapStatus, { label: string; class: string }> = {
  live: { label: "Live", class: "bg-uncommon/10 text-uncommon border-uncommon/30" },
  "in-progress": { label: "In progress", class: "bg-rare/10 text-rare border-rare/30" },
  planned: { label: "Planned", class: "bg-muted text-muted-foreground border-border/50" },
}
