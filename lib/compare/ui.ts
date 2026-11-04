import { create } from "zustand"
import type { CompareEntry } from "./store"

/**
 * Etat d'interface du comparateur, volontairement non persiste.
 *
 *  - `quickOpen` : le popup de comparaison. Partage pour qu'un autre point
 *    d'entree que la barre flottante puisse l'ouvrir (une carte de liste dont
 *    l'arme figure plusieurs fois, et qu'il faut donc retirer colonne par
 *    colonne).
 *  - `editTarget` : la colonne qu'une fiche d'arme ouverte via "Edit build"
 *    est en train d'editer, identifiee par son arme ET son dernier build
 *    connu. Une position ne suffit pas : retirer une colonne depuis le popup
 *    decale les suivantes, et la fiche aurait reecrit le mauvais build.
 */
interface CompareUiState {
  quickOpen: boolean
  setQuickOpen: (open: boolean) => void
  editTarget: Pick<CompareEntry, "ref" | "init"> | null
}

export const useCompareUi = create<CompareUiState>()((set) => ({
  quickOpen: false,
  setQuickOpen: (open) => set({ quickOpen: open }),
  editTarget: null,
}))
