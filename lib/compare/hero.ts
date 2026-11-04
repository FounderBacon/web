import type { LoadoutPresetSnapshot } from "@/lib/loadout/presets"
import type { LoadoutHeroSlot, LoadoutTeamPerk } from "@/lib/loadout/store"
import { loadoutToApiPayload, type LoadoutApiPayload } from "@/lib/loadout/selectors"
import type { CalculatedStats } from "@/lib/types/calculate"

/**
 * Loadout de heros propre a une colonne du comparateur.
 *
 * Par defaut une colonne suit le loadout courant de l'utilisateur (`hero`
 * absent). Fixer un loadout par colonne permet de comparer la meme arme sous
 * deux builds de heros — ou deux armes chacune avec le sien.
 *
 * Seuls les identifiants de perks sont gardes : c'est ce que l'API consomme, et
 * ce qui reste lisible dans une URL partagee. Les presets ne vivent que dans le
 * localStorage de leur auteur, donc on ne reference jamais un preset par son id.
 */
export interface HeroBuild {
  // Nom du preset d'origine, pour l'affichage. Perdu dans un lien partage :
  // le libelle retombe alors sur "Custom loadout".
  name?: string
  commanderPerkId?: string
  supportPerkIds: string[]
  teamPerkIds: string[]
  // Heros choisis (noms, icones, perks) : de quoi rouvrir l'editeur de la
  // colonne. Absent d'un lien partage, qui ne transporte que les identifiants
  // de perks ; l'editeur repart alors du loadout courant.
  slots?: HeroSlots
}

export interface HeroSlots {
  commander: LoadoutHeroSlot | null
  support: (LoadoutHeroSlot | null)[]
  teamPerks: LoadoutTeamPerk[]
}

function sortedIds(ids: string[]): string[] {
  return ids.filter(Boolean).slice().sort()
}

/** Forme canonique : l'ordre des perks de soutien et d'equipe n'a pas de sens. */
export function normalizeHero(hero: HeroBuild | undefined): HeroBuild | undefined {
  if (!hero) return undefined
  const normalized: HeroBuild = {
    ...(hero.name && { name: hero.name }),
    ...(hero.commanderPerkId && { commanderPerkId: hero.commanderPerkId }),
    supportPerkIds: sortedIds(hero.supportPerkIds),
    teamPerkIds: sortedIds(hero.teamPerkIds),
    ...(hero.slots && { slots: hero.slots }),
  }
  const empty = !normalized.commanderPerkId && normalized.supportPerkIds.length === 0 && normalized.teamPerkIds.length === 0
  return empty ? undefined : normalized
}

/** Identite d'un loadout : le nom d'affichage n'en fait pas partie. */
export function sameHero(a: HeroBuild | undefined, b: HeroBuild | undefined): boolean {
  const x = normalizeHero(a)
  const y = normalizeHero(b)
  if (!x || !y) return !x && !y
  return (
    (x.commanderPerkId ?? "") === (y.commanderPerkId ?? "") &&
    x.supportPerkIds.join(",") === y.supportPerkIds.join(",") &&
    x.teamPerkIds.join(",") === y.teamPerkIds.join(",")
  )
}

export function heroToPayload(hero: HeroBuild): LoadoutApiPayload {
  return {
    ...(hero.commanderPerkId && { commanderPerkId: hero.commanderPerkId }),
    supportPerkIds: hero.supportPerkIds,
    teamPerkIds: hero.teamPerkIds,
  }
}

/** Loadout a envoyer a l'API pour une colonne : le sien, sinon celui de l'utilisateur. */
export function effectiveHeroPayload(
  hero: HeroBuild | undefined,
  fallback: LoadoutApiPayload | undefined,
): LoadoutApiPayload | undefined {
  const own = normalizeHero(hero)
  return own ? heroToPayload(own) : fallback
}

/** Loadout fige a partir de heros choisis. Undefined si rien n'est selectionne. */
export function heroFromSlots(name: string | undefined, slots: HeroSlots): HeroBuild | undefined {
  const payload = loadoutToApiPayload(slots)
  if (!payload) return undefined
  return normalizeHero({ ...(name && { name }), ...payload, slots })
}

/** Loadout fige a partir d'un preset enregistre. Undefined si le preset est vide. */
export function heroFromPreset(name: string, snapshot: LoadoutPresetSnapshot): HeroBuild | undefined {
  return heroFromSlots(name, {
    commander: snapshot.commander,
    support: snapshot.support,
    teamPerks: snapshot.teamPerks,
  })
}

// ── URL ──────────────────────────────────────────────────────────

/** Parametres d'URL d'un loadout de colonne (`hc`, `hs`, `ht`, `hn` + cle de colonne). */
export function heroToParams(hero: HeroBuild | undefined, key: string): Record<string, string> {
  const h = normalizeHero(hero)
  if (!h) return {}
  return {
    ...(h.commanderPerkId && { [`hc${key}`]: h.commanderPerkId }),
    ...(h.supportPerkIds.length > 0 && { [`hs${key}`]: h.supportPerkIds.join(",") }),
    ...(h.teamPerkIds.length > 0 && { [`ht${key}`]: h.teamPerkIds.join(",") }),
    ...(h.name && { [`hn${key}`]: h.name }),
  }
}

export function heroFromParams(get: (name: string) => string | null | undefined, key: string): HeroBuild | undefined {
  const csv = (value: string | null | undefined) => (value ? value.split(",").filter(Boolean) : [])
  return normalizeHero({
    ...(get(`hn${key}`) && { name: get(`hn${key}`)! }),
    ...(get(`hc${key}`) && { commanderPerkId: get(`hc${key}`)! }),
    supportPerkIds: csv(get(`hs${key}`)),
    teamPerkIds: csv(get(`ht${key}`)),
  })
}

// ── Gain de DPS du heros ─────────────────────────────────────────

/**
 * Stats d'une colonne enrichies de ce que le loadout de heros y ajoute.
 *
 * Le gain se mesure sur le DPS moyen avec crit ("avgDps"), le plus proche du
 * jeu reel, face au meme calcul sans aucun heros. Il est mesure arme par arme :
 * les perks de heros ne s'appliquent qu'a leur type (distance ou melee) et a
 * leur categorie, donc le meme loadout apporte beaucoup a un fusil d'assaut et
 * rien a une epee. C'est precisement ce qu'on veut voir.
 */
export type StatsWithHeroGain = CalculatedStats & {
  heroDpsGain?: number
  heroDpsGainPercent?: number
}

export function withHeroGain(stats: CalculatedStats | null, base: CalculatedStats | null): CalculatedStats | null {
  if (!stats || !base) return stats
  const gain = stats.avgDps - base.avgDps
  if (!Number.isFinite(gain)) return stats
  const enriched: StatsWithHeroGain = {
    ...stats,
    heroDpsGain: Math.round(gain * 100) / 100,
    // Une base nulle n'a pas de pourcentage : on n'invente pas un infini.
    ...(base.avgDps > 0 && { heroDpsGainPercent: Math.round((gain / base.avgDps) * 1000) / 10 }),
  }
  return enriched
}
