import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { HeroClass } from "@/lib/api/heroes"
import type { Rarity } from "@/lib/types/shared"

// ── Types ────────────────────────────────────────────────────────

// Slot d'un hero dans le loadout (commander ou support)
export interface LoadoutHeroSlot {
  heroSlug: string
  heroName: string
  heroIconUrl: string
  heroClass: HeroClass
  rarity: Rarity
  // perkId du commander perk OU du standard perk selon le slot
  perkId: string
  perkName: string
  perkIcon: string
  perkDescription: string
}

export interface LoadoutTeamPerk {
  perkId: string
  name: string
  icon: string
  requirements: string
  description?: string
}

// ── State ────────────────────────────────────────────────────────

const SUPPORT_SLOTS = 5

interface LoadoutState {
  commander: LoadoutHeroSlot | null
  support: (LoadoutHeroSlot | null)[]
  teamPerks: LoadoutTeamPerk[]
  // Offensive du compte (F.O.R.T.) — applique en defaut sur les pages d'arme
  offensive: number
}

interface LoadoutActions {
  setCommander: (slot: LoadoutHeroSlot | null) => void
  setSupport: (index: number, slot: LoadoutHeroSlot | null) => void
  toggleTeamPerk: (perk: LoadoutTeamPerk) => void
  setOffensive: (value: number) => void
  clear: () => void
}

const initialState: LoadoutState = {
  commander: null,
  support: Array(SUPPORT_SLOTS).fill(null),
  teamPerks: [],
  offensive: 0,
}

export const useLoadout = create<LoadoutState & LoadoutActions>()(
  persist(
    (set) => ({
      ...initialState,

      setCommander: (slot) => set({ commander: slot }),

      setSupport: (index, slot) =>
        set((state) => {
          if (index < 0 || index >= SUPPORT_SLOTS) return state
          const next = [...state.support]
          next[index] = slot
          return { support: next }
        }),

      toggleTeamPerk: (perk) =>
        set((state) => {
          const exists = state.teamPerks.some((p) => p.perkId === perk.perkId)
          return {
            teamPerks: exists
              ? state.teamPerks.filter((p) => p.perkId !== perk.perkId)
              : [...state.teamPerks, perk],
          }
        }),

      setOffensive: (value) => set({ offensive: Math.max(0, value | 0) }),

      clear: () => set(initialState),
    }),
    {
      name: "fbcn-loadout",
      version: 2,
      migrate: (persisted, version) => {
        // v1 -> v2 : ajout du champ offensive
        if (version < 2 && persisted && typeof persisted === "object") {
          return { ...persisted, offensive: 0 } as LoadoutState & LoadoutActions
        }
        return persisted as LoadoutState & LoadoutActions
      },
    },
  ),
)
