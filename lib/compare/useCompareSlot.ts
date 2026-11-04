"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { fetchRangedWeapon, fetchMeleeWeapon, calculateWeaponStats } from "@/lib/api/weapons"
import type { WeaponDetail, Perk, TierEntry } from "@/lib/types/weapon"
import { isTierSplit } from "@/lib/types/weapon"
import type { CalculatedStats } from "@/lib/types/calculate"
import type { LoadoutApiPayload } from "@/lib/loadout/selectors"

export type WeaponType = "ranged" | "melee"

// Reference d'arme telle qu'encodee dans l'URL : "ranged:nocturno".
export interface WeaponRef {
  type: WeaponType
  slug: string
}

export function parseWeaponRef(raw: string | null): WeaponRef | null {
  if (!raw) return null
  const [type, slug] = raw.split(":")
  if ((type !== "ranged" && type !== "melee") || !slug) return null
  return { type, slug }
}

export function serializeWeaponRef(ref: WeaponRef): string {
  return `${ref.type}:${ref.slug}`
}

// Etat initial d'une colonne, restaure depuis l'URL.
export interface CompareSlotInit {
  tier?: string
  material?: "ore" | "crystal"
  level?: number
  offensive?: number
  perkIds?: string[]
}

export interface CompareSlotState {
  weapon: WeaponDetail | null
  loading: boolean
  error: boolean
  tier: string
  material: "ore" | "crystal"
  level: number
  offensive: number
  selectedPerks: Record<number, Perk | null>
  stats: CalculatedStats | null
  statsLoading: boolean
  hasSplit: boolean
  setTier: (tier: string) => void
  setMaterial: (material: "ore" | "crystal") => void
  setLevel: (level: number) => void
  setOffensive: (offensive: number) => void
  selectPerk: (slot: number, perk: Perk | null) => void
  resetPerks: () => void
}

/**
 * Gere une colonne du comparateur : chargement de l'arme, tier/materiau/level
 * independants, perks, et appel /calculate.
 *
 * Le loadout heros est passe en parametre pour rester identique sur toutes les
 * colonnes — c'est ce qui rend la comparaison valide.
 */
export function useCompareSlot(
  ref: WeaponRef | null,
  heroPayload: LoadoutApiPayload | undefined,
  init?: CompareSlotInit,
): CompareSlotState {
  const [weapon, setWeapon] = useState<WeaponDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [tier, setTier] = useState(init?.tier ?? "1")
  const [material, setMaterial] = useState<"ore" | "crystal">(init?.material ?? "ore")
  const [level, setLevel] = useState(init?.level ?? 0)
  const [offensive, setOffensive] = useState(init?.offensive ?? 0)
  const [selectedPerks, setSelectedPerks] = useState<Record<number, Perk | null>>({})
  const [stats, setStats] = useState<CalculatedStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Les valeurs d'URL ne s'appliquent qu'au premier chargement de l'arme.
  const initRef = useRef(init)
  const initConsumedRef = useRef(false)
  const levelFromInitRef = useRef(init?.level !== undefined)
  const calcAbortRef = useRef<AbortController | null>(null)

  const slotKey = ref ? serializeWeaponRef(ref) : null

  // Chargement de l'arme + restauration des perks depuis l'URL.
  useEffect(() => {
    if (!ref) {
      setWeapon(null)
      setStats(null)
      setError(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    const request = ref.type === "melee" ? fetchMeleeWeapon(ref.slug) : fetchRangedWeapon(ref.slug)

    request
      .then((data) => {
        if (cancelled) return
        // L'API repond 200 avec un objet d'erreur pour un slug inconnu : sans ce
        // controle, une arme vide traverse le rendu et casse la page.
        if (!data?.tiers) {
          setError(true)
          setWeapon(null)
          return
        }
        setWeapon(data)

        // Perks d'URL : uniquement au premier montage, sur l'arme d'origine.
        if (!initConsumedRef.current && initRef.current?.perkIds?.length && data.perkSlots) {
          const restored: Record<number, Perk | null> = {}
          for (const slot of data.perkSlots) {
            const perkId = initRef.current.perkIds[slot.slot]
            if (!perkId) continue
            const found = slot.availablePerks.find((p) => p.perkId === perkId)
            if (found) restored[slot.slot] = found
          }
          setSelectedPerks(restored)
        } else {
          setSelectedPerks({})
        }
        initConsumedRef.current = true
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slotKey])

  // Le tier de l'URL peut ne pas exister sur l'arme chargee (ex: apres un swap).
  useEffect(() => {
    if (!weapon?.tiers) return
    if (weapon.tiers[tier]) return
    const first = Object.keys(weapon.tiers)[0]
    if (first) setTier(first)
  }, [weapon, tier])

  // Le level suit le tier : on le ramene au minimum sauf au premier passage.
  useEffect(() => {
    if (!weapon?.tiers) return
    const entry: TierEntry | undefined = weapon.tiers[tier]
    if (!entry) return
    const td = isTierSplit(entry) ? entry[material] : entry
    const range = td?.levelRange
    if (!range) return

    if (levelFromInitRef.current) {
      levelFromInitRef.current = false
      setLevel((prev) => Math.max(range.min, Math.min(range.max, prev)))
      return
    }
    setLevel(range.min)
  }, [weapon, tier, material])

  // Appel /calculate a chaque changement de configuration.
  const heroKey = JSON.stringify(heroPayload ?? null)

  useEffect(() => {
    if (!weapon?.tiers || !ref) return
    if (!weapon.tiers[tier]) return

    calcAbortRef.current?.abort()
    const controller = new AbortController()
    calcAbortRef.current = controller

    const perkIds = Object.values(selectedPerks)
      .filter((p): p is Perk => p !== null)
      .map((p) => p.perkId)

    setStatsLoading(true)

    calculateWeaponStats(ref.type, ref.slug, {
      tier,
      material,
      level,
      offensive,
      perkIds,
      ...(heroPayload && { hero: heroPayload }),
    })
      .then((res) => {
        if (controller.signal.aborted) return
        setStats(res.stats)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setStats(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatsLoading(false)
      })

    return () => controller.abort()
    // heroKey serialise le loadout pour eviter un recalcul a chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weapon, slotKey, tier, material, level, offensive, selectedPerks, heroKey])

  const selectPerk = useCallback((slot: number, perk: Perk | null) => {
    setSelectedPerks((prev) => ({ ...prev, [slot]: perk }))
  }, [])

  const resetPerks = useCallback(() => setSelectedPerks({}), [])

  // L'API peut renvoyer une arme sans tiers : sans garde, Object.values casse
  // le rendu de toute la page.
  const hasSplit = weapon?.tiers
    ? Object.values(weapon.tiers).some((entry) => entry && isTierSplit(entry))
    : false

  return {
    weapon,
    loading,
    error,
    tier,
    material,
    level,
    offensive,
    selectedPerks,
    stats,
    statsLoading,
    hasSplit,
    setTier,
    setMaterial,
    setLevel,
    setOffensive,
    selectPerk,
    resetPerks,
  }
}
