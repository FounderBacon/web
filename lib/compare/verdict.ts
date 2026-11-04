import { normalizedPositions, type CompareGroupResult } from "./stats"

/**
 * Verdict du comparateur : qui domine, et sur quoi.
 *
 * Le tableau dit qui gagne chaque ligne, mais l'oeil ne peut pas agreger une
 * quarantaine de lignes — d'ou ce resume.
 *
 * L'agregation se fait par categorie, jamais en comptant les lignes gagnees :
 * "DPS", "Crit DPS", "Avg DPS" et "HS DPS" varient ensemble, et un decompte
 * brut accorderait quatre fois le meme point a la meme arme. Chaque categorie
 * pese donc pareil, quel que soit son nombre de lignes.
 */

export interface ColumnVerdict {
  // Score global 0..100, ou null si aucune categorie n'etait comparable.
  score: number | null
  // Libelles des categories que cette colonne domine.
  leads: string[]
}

export interface CompareVerdict {
  columns: ColumnVerdict[]
  // Index de la colonne qui domine chaque categorie, par libelle.
  leaderByGroup: Record<string, number | null>
  // Categories qui ont pu etre departagees : le denominateur de "leads 3 of 6".
  decidedGroups: number
}

function mean(values: number[]): number | null {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
}

export function buildVerdict(allGroups: CompareGroupResult[], columnCount: number): CompareVerdict {
  const groups = allGroups.filter((group) => group.scored !== false)
  const indexes = Array.from({ length: columnCount }, (_, i) => i)

  // Moyenne de la position relative de chaque colonne, categorie par categorie.
  // Une colonne qui ne porte aucune ligne comparable de la categorie (une epee
  // face aux stats de tir) n'y est pas notee, plutot que notee zero.
  const groupMeans = groups.map((group) => {
    const perColumn: number[][] = indexes.map(() => [])
    for (const row of group.rows) {
      normalizedPositions(row).forEach((position, i) => {
        if (position !== null) perColumn[i].push(position)
      })
    }
    return perColumn.map(mean)
  })

  const leaderByGroup: Record<string, number | null> = {}
  groups.forEach((group, gi) => {
    const scored = groupMeans[gi]
      .map((value, index) => ({ value, index }))
      .filter((entry): entry is { value: number; index: number } => entry.value !== null)

    // Une seule colonne notee : rien n'a ete departage. Egalite en tete :
    // pas de vainqueur, comme pour le meilleur d'une ligne.
    if (scored.length < 2) {
      leaderByGroup[group.label] = null
      return
    }
    const best = Math.max(...scored.map((entry) => entry.value))
    const winners = scored.filter((entry) => entry.value === best)
    leaderByGroup[group.label] = winners.length === 1 ? winners[0].index : null
  })

  const decidedGroups = Object.values(leaderByGroup).filter((leader) => leader !== null).length

  const columns = indexes.map((i) => {
    // Moyenne des moyennes de categorie : sans ce second palier, "Damage" et
    // ses sept lignes pesaient plus du double de "Crit" et ses trois.
    const score = mean(groupMeans.map((means) => means[i]).filter((v): v is number => v !== null))
    return {
      score: score === null ? null : Math.round(score * 100),
      leads: groups.filter((g) => leaderByGroup[g.label] === i).map((g) => g.label),
    }
  })

  return { columns, leaderByGroup, decidedGroups }
}
