import { heroFromParams, heroToParams } from "./hero"
import { normalizePerkIds } from "./store"
import type { CompareSlotInit, WeaponRef } from "./useCompareSlot"

// Present dans l'URL quand la fiche d'arme edite une colonne du comparateur.
export const COMPARE_EDIT_PARAM = "cmp"

// Suffixe des parametres du loadout de la colonne. La fiche d'arme lit deja
// `hc`, `hs1..5` et `htp` pour son propre loadout (slugs de heros) : sans
// suffixe, des identifiants de perks y seraient pris pour des heros.
const HERO_KEY = "x"

/**
 * Lien "Edit build" d'une colonne : la fiche de l'arme, pre-reglee sur le build
 * de la colonne (memes parametres que le lien de partage) et marquee comme
 * edition.
 *
 * La colonne n'est pas designee par sa position mais par ce build : la fiche
 * le relit (`readEditInit`) pour retrouver l'entree, ce qui resiste aux
 * colonnes retirees ou decalees entre-temps.
 */
export function compareEditHref(locale: string, ref: WeaponRef, init: CompareSlotInit): string {
  const q = new URLSearchParams()
  if (init.tier) q.set("t", init.tier)
  if (init.material) q.set("m", init.material)
  if (init.level) q.set("l", String(init.level))
  // Seulement si la colonne fixe la sienne. Absente, la colonne suit
  // l'offensive du profil, et la fiche aussi : elle ne la detache donc pas.
  if (init.offensive !== undefined) q.set("o", String(init.offensive))
  // Les perks sont positionnels : l'index est le numero de slot.
  init.perkIds?.forEach((perkId, slot) => {
    if (perkId) q.set(`p${slot}`, perkId)
  })
  // Loadout de heros de la colonne : sans lui, la fiche retrouverait la
  // colonne par un build sans heros et ne la reconnaitrait pas.
  for (const [name, value] of Object.entries(heroToParams(init.hero, HERO_KEY))) q.set(name, value)
  q.set(COMPARE_EDIT_PARAM, "1")
  return `/${locale}/weapons/${ref.type}/${ref.slug}?${q.toString()}`
}

/** Build porte par un lien `compareEditHref`, dans la forme stockee par le comparateur. */
export function readEditInit(params: Record<string, string>): CompareSlotInit {
  const level = parseInt(params.l ?? "", 10)
  const offensive = parseInt(params.o ?? "", 10)
  const material = params.m

  const perkSlots = Object.keys(params)
    .map((key) => /^p(\d+)$/.exec(key))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]))
  const perkIds = normalizePerkIds(
    perkSlots.length > 0
      ? Array.from({ length: Math.max(...perkSlots) + 1 }, (_, slot) => params[`p${slot}`] ?? "")
      : [],
  )

  const hero = heroFromParams((name) => params[name], HERO_KEY)

  return {
    ...(hero && { hero }),
    ...(params.t && { tier: params.t }),
    ...(material === "ore" || material === "crystal" ? { material } : {}),
    ...(level > 0 && { level }),
    // 0 compris : une offensive fixee a zero reste une valeur propre a la colonne.
    ...(!Number.isNaN(offensive) && offensive >= 0 && { offensive }),
    ...(perkIds.length > 0 && { perkIds }),
  }
}
