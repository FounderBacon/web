"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { fetchRangedWeapon, fetchMeleeWeapon, calculateWeaponStats } from "@/lib/api/weapons"
import type { WeaponDetail, Perk, TierEntry } from "@/lib/types/weapon"
import { isTierSplit } from "@/lib/types/weapon"
import type { CalculatedStats } from "@/lib/types/calculate"
import type { LoadoutApiPayload } from "@/lib/loadout/selectors"
import { effectiveHeroPayload, normalizeHero, withHeroGain, type HeroBuild } from "./hero"

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
  // Loadout de heros propre a la colonne. Absent : elle suit celui de l'utilisateur.
  hero?: HeroBuild
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
  hero: HeroBuild | undefined
  stats: CalculatedStats | null
  statsLoading: boolean
  hasSplit: boolean
  setTier: (tier: string) => void
  setMaterial: (material: "ore" | "crystal") => void
  setLevel: (level: number) => void
  setOffensive: (offensive: number) => void
  setHero: (hero: HeroBuild | undefined) => void
  selectPerk: (slot: number, perk: Perk | null) => void
  resetPerks: () => void
}

/**
 * Gere une colonne du comparateur : chargement de l'arme, tier/materiau/level
 * independants, perks, et appel /calculate.
 *
 * Le loadout heros passe en parametre est celui de l'utilisateur, applique par
 * defaut a toutes les colonnes. Une colonne peut fixer le sien (`setHero`) pour
 * comparer deux builds de heros ; le gain de DPS qu'il apporte est alors mesure
 * face au meme calcul sans heros.
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
  const [hero, setHero] = useState<HeroBuild | undefined>(normalizeHero(init?.hero))
  const [stats, setStats] = useState<CalculatedStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Build de depart a appliquer, et build deja applique.
  //
  // L'init n'est pas toujours connu au premier rendu : la page compare lit
  // d'abord l'URL, et ne retombe sur le store persiste que dans un effet de
  // layout (le localStorage est invisible au serveur). Se contenter de la
  // valeur du montage faisait repartir toute comparaison restauree depuis le
  // store sur le build par defaut — tier 1, niveau 1, aucun perk — ce qui
  // vidait de son sens le fait de comparer deux builds d'une meme arme.
  //
  // La comparaison porte sur l'identite de l'objet, pas sur son contenu :
  // changer l'arme d'une colonne conserve le meme objet init, qui ne doit donc
  // pas etre re-applique a une arme a laquelle il n'appartient pas.
  const pendingInitRef = useRef<CompareSlotInit | undefined>(init)
  const appliedInitRef = useRef<CompareSlotInit | undefined>(undefined)
  const levelFromInitRef = useRef(false)
  const calcAbortRef = useRef<AbortController | null>(null)

  const slotKey = ref ? serializeWeaponRef(ref) : null

  // Declare avant l'effet de chargement pour s'executer avant lui dans le meme
  // commit : l'init recu ce rendu doit etre visible quand l'arme se charge.
  useEffect(() => {
    pendingInitRef.current = init
  })

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

        // Le build de depart ne s'applique qu'une fois, au chargement de
        // l'arme a laquelle il se rapporte.
        const pending = pendingInitRef.current
        const fresh = pending !== undefined && pending !== appliedInitRef.current
        appliedInitRef.current = pendingInitRef.current

        if (fresh) {
          setHero(normalizeHero(pending.hero))
          if (pending.tier && data.tiers[pending.tier]) setTier(pending.tier)
          if (pending.material) setMaterial(pending.material)
          if (pending.offensive !== undefined) setOffensive(pending.offensive)
          if (pending.level !== undefined) {
            // Signale a l'effet "le level suit le tier" de borner cette valeur
            // au lieu de la remplacer par le minimum du tier.
            levelFromInitRef.current = true
            setLevel(pending.level)
          }
        }

        if (fresh && pending.perkIds?.length && data.perkSlots) {
          const restored: Record<number, Perk | null> = {}
          for (const slot of data.perkSlots) {
            const perkId = pending.perkIds[slot.slot]
            if (!perkId) continue
            const found = slot.availablePerks.find((p) => p.perkId === perkId)
            if (found) restored[slot.slot] = found
          }
          setSelectedPerks(restored)
        } else {
          setSelectedPerks({})
        }
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
    // Cle sur l'identite serialisee de l'arme : `ref` est un objet recree par
    // l'appelant a chaque rendu, en dependre rechargerait l'arme en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const effectiveHero = effectiveHeroPayload(hero, heroPayload)
  const heroKey = JSON.stringify(effectiveHero ?? null)

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

    const params = { tier, material, level, offensive, perkIds }

    // Sans heros, un seul calcul. Avec, un second sans lui : c'est la
    // difference des deux qui donne le gain de DPS du loadout.
    Promise.all([
      calculateWeaponStats(ref.type, ref.slug, { ...params, ...(effectiveHero && { hero: effectiveHero }) }),
      effectiveHero ? calculateWeaponStats(ref.type, ref.slug, params) : Promise.resolve(null),
    ])
      .then(([res, base]) => {
        if (controller.signal.aborted) return
        setStats(withHeroGain(res.stats, base?.stats ?? null))
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
    hero,
    stats,
    statsLoading,
    hasSplit,
    setTier,
    setMaterial,
    setLevel,
    setOffensive,
    setHero,
    selectPerk,
    resetPerks,
  }
}
