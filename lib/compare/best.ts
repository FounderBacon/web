import type { CalculatedStats } from "@/lib/types/calculate"
import { formatStatName } from "@/lib/constants"
import { buildComparison } from "./stats"
import { buildVerdict } from "./verdict"

/**
 * Index de la colonne au meilleur score du verdict, ou -1 s'il n'y en a pas :
 * moins de deux colonnes comparables, ou egalite en tete (aucune ne "gagne").
 * Partage par la page compare et la modal pour afficher le meme badge.
 */
export function bestColumnIndex(columns: (CalculatedStats | null)[]): number {
  if (columns.filter((c) => c !== null).length < 2) return -1
  const verdict = buildVerdict(buildComparison(columns, formatStatName), columns.length)
  const scores = verdict.columns.map((c) => c.score)
  const top = Math.max(...scores.map((s) => s ?? -1))
  if (top < 0) return -1
  const winners = scores.reduce<number[]>((acc, s, i) => (s === top ? [...acc, i] : acc), [])
  return winners.length === 1 ? winners[0] : -1
}
