"use client"

import { createContext, useContext, type ReactNode } from "react"
import type en from "@/lang/en.json"

export type CompareDict = (typeof en)["compare"]

const CompareI18nContext = createContext<CompareDict | null>(null)

/**
 * Textes du comparateur, fournis une fois par le layout public.
 *
 * Le comparateur vit dans des composants client (page, barre flottante, modal,
 * en-tete de fiche) qui ne peuvent pas attendre `getDictionary` : le serveur
 * charge le dictionnaire et le descend par contexte, plutot que de le faire
 * traverser chaque composant en props.
 */
export function CompareI18nProvider({ dict, children }: { dict: CompareDict; children: ReactNode }) {
  return <CompareI18nContext.Provider value={dict}>{children}</CompareI18nContext.Provider>
}

export function useCompareT(): CompareDict {
  const dict = useContext(CompareI18nContext)
  if (!dict) throw new Error("useCompareT must be used inside <CompareI18nProvider>")
  return dict
}

/** Remplace les `{cle}` d'un libelle par leurs valeurs. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))
}
