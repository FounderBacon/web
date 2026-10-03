"use client"

import { useEffect, useRef, useState } from "react"
import { fetchRangedWeapon, fetchMeleeWeapon, calculateWeaponStats } from "@/lib/api/weapons"
import { isTierSplit, type WeaponDetail } from "@/lib/types/weapon"
import type { CalculatedStats } from "@/lib/types/calculate"
import type { LoadoutApiPayload } from "@/lib/loadout/selectors"
import type { CompareEntry } from "./store"
import { effectiveHeroPayload, withHeroGain } from "./hero"
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
  // Offensive du profil, appliquee aux entrees qui n'en fixent pas.
  profileOffensive = 0,
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

          const material = init.material ?? "ore"
          // Sans level enregistre (arme ajoutee depuis une liste), la page
          // compare retombe sur le minimum du tier ; sans le meme repli ici,
          // le modal et la page affichaient deux valeurs pour la meme colonne.
          const tierEntry = weapon.tiers[tier]
          const tierData = tierEntry && isTierSplit(tierEntry) ? tierEntry[material] : tierEntry
          const level = init.level ?? tierData?.levelRange?.min ?? 0

          const params = {
            tier,
            material,
            level,
            offensive: init.offensive ?? profileOffensive,
            perkIds: init.perkIds?.filter(Boolean) ?? [],
          }
          // Le loadout de la colonne, sinon celui de l'utilisateur. Avec un
          // heros, un second calcul sans lui donne le gain de DPS.
          const hero = effectiveHeroPayload(init.hero, heroPayload)
          const [res, base] = await Promise.all([
            calculateWeaponStats(ref.type, ref.slug, { ...params, ...(hero && { hero }) }),
            hero ? calculateWeaponStats(ref.type, ref.slug, params) : Promise.resolve(null),
          ])
          return { entry, weapon, stats: withHeroGain(res.stats, base?.stats ?? null) }
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
  }, [key, heroKey, enabled, profileOffensive])

  return { resolved, loading }
}
