import { create } from "zustand"
import { persist } from "zustand/middleware"
import { sameHero } from "./hero"
import type { WeaponRef, CompareSlotInit } from "./useCompareSlot"

// Quatre colonnes max, aligne sur la page compare. Comparer une meme arme
// declinee par perk atteint vite trois colonnes ; au-dela de quatre, le radar
// devient illisible et les colonnes ne tiennent plus.
export const MAX_COMPARE = 4

// Couleurs de serie fixes, partagees par toutes les surfaces (cartes, radar,
// tableau de stats, modal rapide) : la rarete ne peut pas servir de cle
// visuelle puisque deux armes comparees ont souvent la meme, et c'est cette
// meme couleur qui permet de retrouver une colonne une fois qu'on a scrolle
// passe l'en-tete.
// Le rose ferme la serie : c'est la teinte qui reste la plus distincte du
// ciel, de l'orange et du violet a la taille d'une pastille. Un vert aurait
// concurrence le vert des ecarts favorables, un jaune se serait confondu
// avec l'orange.
export const SERIES_COLORS = ["#38bdf8", "#fb923c", "#a78bfa", "#f472b6"]

// Une entree = une arme plus la configuration avec laquelle elle a ete ajoutee.
// On garde la config pour que "Compare" depuis une fiche arme reporte le build
// courant, pas une arme nue.
export interface CompareEntry {
  ref: WeaponRef
  init: CompareSlotInit
  // Metadonnees d'affichage : la barre flottante doit rendre les vignettes sans
  // refetch les armes a chaque page.
  name?: string
  icon?: string
  rarity?: string
}

interface CompareState {
  entries: CompareEntry[]
}

interface CompareActions {
  // Ajoute l'arme, ou remplace sa config si elle est deja presente.
  add: (entry: CompareEntry) => void
  removeAt: (index: number) => void
  setAt: (index: number, entry: CompareEntry | null) => void
  clear: () => void
}

const initialState: CompareState = { entries: [] }

function sameRef(a: WeaponRef, b: WeaponRef): boolean {
  return a.type === b.type && a.slug === b.slug
}

// Deux colonnes peuvent porter la meme arme : comparer deux builds d'un meme
// fusil — un perk change, un tier de plus — est un usage central du
// comparateur, et c'est meme la seule facon de mesurer ce que vaut ce perk.
// L'identite d'une entree est donc l'arme ET son build, pas l'arme seule.
/**
 * Perks sans les emplacements vides de fin. Choisir puis retirer un perk sur
 * la fiche laisse un slot vide en queue (`["a", ""]`) : sans cette
 * normalisation, ce build ne correspondait plus a `["a"]` et la meme
 * configuration pouvait occuper deux colonnes.
 */
export function normalizePerkIds(perkIds: string[] | undefined): string[] {
  const ids = [...(perkIds ?? [])]
  while (ids.length > 0 && !ids[ids.length - 1]) ids.pop()
  return ids
}

export function sameBuild(a: CompareSlotInit, b: CompareSlotInit): boolean {
  return (
    (a.tier ?? "") === (b.tier ?? "") &&
    // Absent = "ore", le defaut de toutes les surfaces. La page compare l'ecrit
    // des que l'arme a un tier splitte, la fiche seulement si le tier courant
    // l'est : sans ce defaut commun, le meme build ne se reconnaissait pas.
    (a.material ?? "ore") === (b.material ?? "ore") &&
    (a.level ?? 0) === (b.level ?? 0) &&
    // Absente (suit le profil) et 0 (fixee a zero) sont deux builds differents.
    a.offensive === b.offensive &&
    // Les perks sont positionnels : l'ordre fait partie de l'identite.
    normalizePerkIds(a.perkIds).join(",") === normalizePerkIds(b.perkIds).join(",") &&
    // Meme arme, meme build, mais sous deux loadouts de heros : deux colonnes.
    sameHero(a.hero, b.hero)
  )
}

export function sameEntry(a: CompareEntry, b: CompareEntry): boolean {
  return sameRef(a.ref, b.ref) && sameBuild(a.init, b.init)
}

export const useCompare = create<CompareState & CompareActions>()(
  persist(
    (set) => ({
      ...initialState,

      add: (entry) =>
        set((state) => {
          // Seul un build strictement identique est refuse : il ferait deux
          // colonnes rigoureusement egales, sans rien a comparer.
          const existing = state.entries.findIndex((e) => sameEntry(e, entry))
          if (existing !== -1) {
            const next = [...state.entries]
            next[existing] = entry
            return { entries: next }
          }
          if (state.entries.length >= MAX_COMPARE) return state
          return { entries: [...state.entries, entry] }
        }),

      removeAt: (index) =>
        set((state) => ({ entries: state.entries.filter((_, i) => i !== index) })),

      setAt: (index, entry) =>
        set((state) => {
          const next = [...state.entries]
          if (entry === null) {
            next.splice(index, 1)
          } else if (index >= next.length) {
            if (next.length >= MAX_COMPARE) return state
            next.push(entry)
          } else {
            next[index] = entry
          }
          return { entries: next }
        }),

      clear: () => set({ entries: [] }),
    }),
    { name: "fbcn-compare" },
  ),
)

/**
 * Presence d'une arme dans le comparateur, du point de vue du build affiche :
 *
 *  - "exact"       : ce build precis y est deja, le reajouter ne ferait rien ;
 *  - "other-build" : l'arme y est, mais avec une autre configuration — l'ajouter
 *                    cree une seconde colonne, ce qui est le but ;
 *  - "absent"      : pas dans le comparateur.
 *
 * Le bouton de la fiche d'arme en depend : afficher "In compare" des que
 * l'arme etait presente laissait croire qu'un build modifie ne pouvait plus
 * etre ajoute.
 */
export type CompareMembership = "absent" | "other-build" | "exact"

export function useCompareMembership(ref: WeaponRef | null, init: CompareSlotInit): CompareMembership {
  return useCompare((s) => {
    if (!ref) return "absent"
    const sameWeapon = s.entries.filter((e) => sameRef(e.ref, ref))
    if (sameWeapon.length === 0) return "absent"
    return sameWeapon.some((e) => sameBuild(e.init, init)) ? "exact" : "other-build"
  })
}
