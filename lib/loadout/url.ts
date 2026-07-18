// Encode/decode du loadout dans l'URL pour le partage.
// Format compact :
//   ?c=<commanderSlug>&s=<sup1>,<sup2>,<sup3>&t=<teamPerkId>&o=<offensive>
// Les supports vides sont omis (csv reste compact). Decode : fetch les
// details pour reconstruire les slots complets.

import { fetchHero } from "@/lib/api/heroes"
import { fetchTeamPerk } from "@/lib/api/team-perks"
import { teamPerkIcon } from "@/lib/cdn"
import { buildHeroSlot } from "./buildSlot"
import type { LoadoutHeroSlot, LoadoutTeamPerk } from "./store"

export interface LoadoutSnapshot {
  commander: LoadoutHeroSlot | null
  support: (LoadoutHeroSlot | null)[]
  teamPerks: LoadoutTeamPerk[]
  offensive: number
}

const PARAM_COMMANDER = "c"
const PARAM_SUPPORT = "s"
const PARAM_TEAM_PERK = "t"
const PARAM_OFFENSIVE = "o"

export function encodeLoadoutToParams(state: LoadoutSnapshot): URLSearchParams {
  const params = new URLSearchParams()
  if (state.commander) params.set(PARAM_COMMANDER, state.commander.heroSlug)

  const supportSlugs = state.support.map((s) => s?.heroSlug ?? "").filter(Boolean)
  if (supportSlugs.length > 0) params.set(PARAM_SUPPORT, supportSlugs.join(","))

  if (state.teamPerks[0]) params.set(PARAM_TEAM_PERK, state.teamPerks[0].perkId)

  if (state.offensive > 0) params.set(PARAM_OFFENSIVE, String(state.offensive))

  return params
}

// Detecte si l'URL contient au moins un param de loadout.
export function hasLoadoutParams(params: URLSearchParams): boolean {
  return (
    params.has(PARAM_COMMANDER) ||
    params.has(PARAM_SUPPORT) ||
    params.has(PARAM_TEAM_PERK) ||
    params.has(PARAM_OFFENSIVE)
  )
}

// Reconstruit le state depuis les params. Fetch les heroes et le team perk
// en parallele. Renvoie un snapshot avec les slots remplis.
export async function decodeLoadoutFromParams(params: URLSearchParams): Promise<LoadoutSnapshot> {
  const commanderSlug = params.get(PARAM_COMMANDER) ?? null
  const supportSlugs = (params.get(PARAM_SUPPORT) ?? "").split(",").filter(Boolean).slice(0, 5)
  const teamPerkId = params.get(PARAM_TEAM_PERK) ?? null
  const offensive = Math.max(0, parseInt(params.get(PARAM_OFFENSIVE) ?? "0", 10) || 0)

  const [commanderSlot, supportSlots, teamPerk] = await Promise.all([
    commanderSlug ? fetchHero(commanderSlug).then((h) => buildHeroSlot(h, "commander")).catch(() => null) : Promise.resolve(null),
    Promise.all(
      supportSlugs.map((slug) => fetchHero(slug).then((h) => buildHeroSlot(h, "support")).catch(() => null)),
    ),
    teamPerkId ? fetchTeamPerk(teamPerkId).catch(() => null) : Promise.resolve(null),
  ])

  // Pad supportSlots a 5 (les emplacements vides restent null)
  const support: (LoadoutHeroSlot | null)[] = [...supportSlots, null, null, null, null, null].slice(0, 5)

  const teamPerks: LoadoutTeamPerk[] = teamPerk
    ? [
        {
          perkId: teamPerk.perkId,
          name: teamPerk.name,
          icon: teamPerkIcon(teamPerk.name),
          requirements: teamPerk.requirements ?? "",
          description: teamPerk.description,
        },
      ]
    : []

  return { commander: commanderSlot, support, teamPerks, offensive }
}
