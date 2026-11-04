"use client"

import { useEffect, useRef, useState } from "react"
import { fetchRangedWeapon, fetchMeleeWeapon, calculateWeaponStats } from "@/lib/api/weapons"
import type { WeaponDetail } from "@/lib/types/weapon"
import type { CalculatedStats } from "@/lib/types/calculate"
import type { LoadoutApiPayload } from "@/lib/loadout/selectors"
import type { CompareEntry } from "./store"
import { serializeWeaponRef } from "./useCompareSlot"

export interface ResolvedEntry {
  entry: CompareEntry
  weapon: WeaponDetail | null
  stats: CalculatedStats | null
}

/**
 * Resout une liste d'entrees du comparateur en armes chargees + stats calculees.
 *
 * Contrairement a useCompareSlot, ce hook est en lecture seule : chaque arme
 * garde le build fige dans son entree du store. C'est ce qui permet d'afficher
 * la comparaison ailleurs que sur la page dediee, sans dupliquer les controles.
 */
export function useCompareEntries(
  entries: CompareEntry[],
  heroPayload: LoadoutApiPayload | undefined,
  enabled = true,
): { resolved: ResolvedEntry[]; loading: boolean } {
  const [resolved, setResolved] = useState<ResolvedEntry[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Cle stable : un rendu ne doit relancer les appels que si le contenu change.
  const key = JSON.stringify(entries.map((e) => [serializeWeaponRef(e.ref), e.init]))
  const heroKey = JSON.stringify(heroPayload ?? null)

  useEffect(() => {
    if (!enabled) return
    if (entries.length === 0) {
      setResolved([])
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)

    Promise.all(
      entries.map(async (entry): Promise<ResolvedEntry> => {
        const { ref, init } = entry
        try {
          const weapon =
            ref.type === "melee" ? await fetchMeleeWeapon(ref.slug) : await fetchRangedWeapon(ref.slug)

          // Une arme sans tiers n'est pas calculable : on l'affiche sans stats
          // plutot que de casser le rendu.
          if (!weapon.tiers) return { entry, weapon, stats: null }

          // Le tier stocke peut ne plus exister cote API : on retombe sur le premier.
          const tier = init.tier && weapon.tiers[init.tier] ? init.tier : Object.keys(weapon.tiers)[0]
          if (!tier) return { entry, weapon, stats: null }

          const res = await calculateWeaponStats(ref.type, ref.slug, {
            tier,
            material: init.material ?? "ore",
            level: init.level ?? 0,
            offensive: init.offensive ?? 0,
            perkIds: init.perkIds?.filter(Boolean) ?? [],
            ...(heroPayload && { hero: heroPayload }),
          })
          return { entry, weapon, stats: res.stats }
        } catch {
          // Une arme en echec n'empeche pas d'afficher les autres colonnes.
          return { entry, weapon: null, stats: null }
        }
      }),
    )
      .then((results) => {
        if (controller.signal.aborted) return
        setResolved(results)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
    // key/heroKey serialisent les entrees : evite un refetch a chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, heroKey, enabled])

  return { resolved, loading }
}
