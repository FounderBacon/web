import { api } from "./client"
import type { RoadmapMilestone, RoadmapStatus } from "@/lib/data/roadmap"

// ── Types backend (payload brut /v1/bacon/roadmap) ────────────────
export type BackendRoadmapStatus = "draft" | "planned" | "in-progress" | "shipped" | "cancelled"
export type BackendItemStatus = BackendRoadmapStatus

export interface BackendRoadmapItem {
  title: string
  description: string
  scope: string
  endpoints: string[]
  tags: string[]
  status: BackendItemStatus
}

export interface BackendRoadmapEntry {
  _id: string
  version: string
  title: string
  summary: string
  scope: string[]
  status: BackendRoadmapStatus
  priority: "low" | "medium" | "high"
  order: number
  items: BackendRoadmapItem[]
  dependsOn: string[]
  blockedBy: string | null
  estimatedComplexity: "low" | "medium" | "high"
  isPublic: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface BackendRoadmapResponse {
  data: BackendRoadmapEntry[]
  meta: { limit: number; offset: number }
}

// ── Mapping vers le format consomme par la page ──────────────────
function mapStatus(status: BackendRoadmapStatus): RoadmapStatus {
  if (status === "shipped") return "live"
  if (status === "in-progress") return "in-progress"
  return "planned"
}

// Couleur deduite de la version (semver) pour coller a la palette rarity
function colorFromVersion(version: string): string {
  const clean = version.replace(/^v/, "")
  const [majorStr, minorStr] = clean.split(".")
  const major = Number(majorStr)
  const minor = Number(minorStr)
  if (major >= 1) return "text-mythic"
  switch (minor) {
    case 0: return "text-common"
    case 1: return "text-uncommon"
    case 2: return "text-rare"
    case 3: return "text-epic"
    case 4: return "text-legendary"
    case 5: return "text-mythic"
    default: return "text-common"
  }
}

export function mapToMilestone(entry: BackendRoadmapEntry): RoadmapMilestone {
  return {
    version: entry.version.startsWith("v") ? entry.version : `v${entry.version}`,
    title: entry.title,
    status: mapStatus(entry.status),
    color: colorFromVersion(entry.version),
    items: entry.items.map((it) => ({
      label: it.title,
      done: it.status === "shipped",
    })),
  }
}

// On garde seulement les versions majeures/mineures (x.y.0) pour avoir une
// roadmap haut niveau lisible. Les patchs (0.0.1, 0.0.4, 0.1.1, 0.2.5...)
// sont exposes dans le changelog, pas dans la roadmap publique.
function isMilestoneVersion(version: string): boolean {
  const clean = version.replace(/^v/, "")
  const parts = clean.split(".")
  return parts.length === 3 && parts[2] === "0"
}

// ── Fetch ────────────────────────────────────────────────────────
export async function fetchRoadmap(): Promise<RoadmapMilestone[]> {
  const res = await api.get<BackendRoadmapResponse>("/v1/bacon/roadmap", { skipAuth: true })
  return res.data
    .filter((e) => e.isPublic && isMilestoneVersion(e.version))
    .sort((a, b) => a.order - b.order)
    .map(mapToMilestone)
}
