"use client"

import { useCallback, useState } from "react"
import { useLoadout } from "./store"

export interface OffensiveState {
  // Valeur appliquee : la valeur locale si elle existe, sinon celle du profil.
  offensive: number
  // Vrai quand la page porte sa propre valeur au lieu de suivre le profil.
  isLocal: boolean
  // Valeur locale brute, absente quand la page suit le profil.
  override: number | undefined
  setOffensive: (value: number) => void
  resetOffensive: () => void
}

function parseOffensive(raw: string | null | undefined): number | undefined {
  const n = parseInt(raw ?? "", 10)
  return Number.isNaN(n) ? undefined : Math.max(0, n)
}

/**
 * Offensive F.O.R.T. d'une fiche (arme, piege) : celle du profil par defaut,
 * une valeur propre a la page des que l'utilisateur la modifie.
 *
 * Avant, la fiche d'arme ne recopiait l'offensive du profil qu'une fois, au
 * chargement, et seulement si l'URL n'en portait pas ; la fiche de piege ne
 * la lisait jamais. Ici la valeur suit le profil en continu tant qu'aucune
 * valeur locale n'a ete posee — et `?o=` dans l'URL en pose une.
 */
export function useOffensive(urlValue: string | null | undefined): OffensiveState {
  const profile = useLoadout((s) => s.offensive)
  const [override, setOverride] = useState<number | undefined>(() => parseOffensive(urlValue))

  const setOffensive = useCallback((value: number) => setOverride(Math.max(0, Math.trunc(value) || 0)), [])
  const resetOffensive = useCallback(() => setOverride(undefined), [])

  return {
    offensive: override ?? profile,
    isLocal: override !== undefined,
    override,
    setOffensive,
    resetOffensive,
  }
}
