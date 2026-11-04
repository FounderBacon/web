import { extractStatLabel } from "@/lib/perks"
import type { Perk, PerkSlot } from "@/lib/types/shared"

/**
 * Resume lisible des perks d'une colonne du comparateur.
 *
 * Un simple compteur ("1p") suffisait tant qu'une arme n'occupait qu'une
 * colonne. Des lors qu'on compare la meme arme declinee par perk — l'usage
 * meme du comparateur — trois colonnes affichaient "T5 / Ore / Lv50 / 1p"
 * a l'identique : on ne savait plus quel perk etait dans quelle colonne.
 */

// Au-dela de deux perks nommes, le resume deborde la colonne et redevient
// illisible : on retombe alors sur le compte.
const MAX_NAMED_PERKS = 2

export function perkSummary(
  perks: Perk[],
  countLabel: (count: number) => string = (count) => `${count} perks`,
): string | null {
  if (perks.length === 0) return null
  if (perks.length > MAX_NAMED_PERKS) return countLabel(perks.length)
  return perks.map(extractStatLabel).join(" + ")
}

/** Retrouve les perks d'une entree stockee, qui ne garde que leurs identifiants. */
export function resolvePerks(slots: PerkSlot[] | undefined, perkIds: string[] | undefined): Perk[] {
  if (!slots || !perkIds) return []

  const found: Perk[] = []
  for (const slot of slots) {
    const perkId = perkIds[slot.slot]
    if (!perkId) continue
    const perk = slot.availablePerks.find((p) => p.perkId === perkId)
    if (perk) found.push(perk)
  }
  return found
}
