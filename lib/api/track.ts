import { api } from "./client"

export type TrackEventType =
  | "weapon.viewed"
  | "weapon.calculated"
  | "trap.viewed"
  | "trap.calculated"
  | "hero.viewed"
  | "survivor.viewed"
  | "survivor-lead.viewed"

export type TrackEntityType =
  | "weapon-ranged"
  | "weapon-melee"
  | "trap"
  | "hero"
  | "survivor"
  | "survivor-lead"

export interface TrackPayload {
  type: TrackEventType
  entityType: TrackEntityType
  entitySlug: string
}

// Fire-and-forget : on ne bloque jamais l'UI, on ne propage jamais l'erreur
export function track(payload: TrackPayload): void {
  if (typeof window === "undefined") return

  api.post("/v1/track", payload, { skipAuth: true }).catch(() => {
    // silencieux : un track raté ne doit jamais casser la page
  })
}
