import { normalizePerkIds } from "./store"
import type { CompareSlotInit, WeaponRef } from "./useCompareSlot"

// Present dans l'URL quand la fiche d'arme edite une colonne du comparateur.
export const COMPARE_EDIT_PARAM = "cmp"

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
  // Toujours transmise, meme a 0 : absente, la fiche reprend l'offensive du
  // loadout sauvegarde et reecrivait la colonne sans que l'utilisateur ait
  // touche a quoi que ce soit.
  q.set("o", String(init.offensive ?? 0))
  // Les perks sont positionnels : l'index est le numero de slot.
  init.perkIds?.forEach((perkId, slot) => {
    if (perkId) q.set(`p${slot}`, perkId)
  })
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

  return {
    ...(params.t && { tier: params.t }),
    ...(material === "ore" || material === "crystal" ? { material } : {}),
    ...(level > 0 && { level }),
    ...(offensive > 0 && { offensive }),
    ...(perkIds.length > 0 && { perkIds }),
  }
}
