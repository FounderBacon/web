import type { LoadoutHeroSlot, LoadoutTeamPerk } from "./store"

interface LoadoutSnapshot {
  commander: LoadoutHeroSlot | null
  support: (LoadoutHeroSlot | null)[]
  teamPerks: LoadoutTeamPerk[]
}

// Payload pour l'API /v1/weapons/calculate
export interface LoadoutApiPayload {
  commanderPerkId?: string
  supportPerkIds: string[]
  teamPerkIds: string[]
}

export function loadoutToApiPayload(state: LoadoutSnapshot): LoadoutApiPayload | undefined {
  const supportPerkIds = state.support.filter((s): s is LoadoutHeroSlot => s !== null).map((s) => s.perkId)
  const teamPerkIds = state.teamPerks.map((p) => p.perkId)
  if (!state.commander && supportPerkIds.length === 0 && teamPerkIds.length === 0) {
    return undefined
  }
  return {
    ...(state.commander && { commanderPerkId: state.commander.perkId }),
    supportPerkIds,
    teamPerkIds,
  }
}

export function countFilledSlots(state: LoadoutSnapshot): number {
  let count = 0
  if (state.commander) count += 1
  count += state.support.filter(Boolean).length
  count += state.teamPerks.length
  return count
}

export function hasAnyLoadout(state: LoadoutSnapshot): boolean {
  return state.commander !== null || state.support.some(Boolean) || state.teamPerks.length > 0
}
