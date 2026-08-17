import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { WeaponRef, CompareSlotInit } from "./useCompareSlot"

// Trois colonnes max, aligne sur la page compare : au-dela le radar
// devient illisible et les colonnes ne tiennent plus sur desktop.
export const MAX_COMPARE = 3

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

export const useCompare = create<CompareState & CompareActions>()(
  persist(
    (set) => ({
      ...initialState,

      add: (entry) =>
        set((state) => {
          const existing = state.entries.findIndex((e) => sameRef(e.ref, entry.ref))
          // Re-ajouter une arme deja listee met a jour sa config au lieu de
          // creer un doublon illisible dans le comparateur.
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

// Selecteur derive : evite de reimplementer la comparaison de ref cote composant.
export function useIsInCompare(ref: WeaponRef | null): boolean {
  return useCompare((s) => (ref ? s.entries.some((e) => sameRef(e.ref, ref)) : false))
}
