import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { LoadoutHeroSlot, LoadoutTeamPerk } from "./store"

// Snapshot serialisable d'un loadout (matche le store actif, sans les actions).
export interface LoadoutPresetSnapshot {
  commander: LoadoutHeroSlot | null
  support: (LoadoutHeroSlot | null)[]
  teamPerks: LoadoutTeamPerk[]
  offensive: number
}

export interface LoadoutPreset {
  id: string
  name: string
  createdAt: number
  snapshot: LoadoutPresetSnapshot
}

// Limite douce : evite de blow up le localStorage. Le user voit un message
// d'erreur a la saisie si depasse.
export const PRESETS_LIMIT = 20

interface PresetsState {
  presets: LoadoutPreset[]
}

interface PresetsActions {
  save: (name: string, snapshot: LoadoutPresetSnapshot) => LoadoutPreset
  remove: (id: string) => void
  rename: (id: string, name: string) => void
  clearAll: () => void
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const usePresets = create<PresetsState & PresetsActions>()(
  persist(
    (set) => ({
      presets: [],

      save: (name, snapshot) => {
        const preset: LoadoutPreset = {
          id: genId(),
          name: name.trim().slice(0, 60) || "Untitled",
          createdAt: Date.now(),
          snapshot,
        }
        set((state) => {
          // Garde les plus recents en tete et applique la limite.
          const next = [preset, ...state.presets].slice(0, PRESETS_LIMIT)
          return { presets: next }
        })
        return preset
      },

      remove: (id) => set((state) => ({ presets: state.presets.filter((p) => p.id !== id) })),

      rename: (id, name) =>
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, name: name.trim().slice(0, 60) || p.name } : p,
          ),
        })),

      clearAll: () => set({ presets: [] }),
    }),
    {
      name: "fbcn-loadout-presets",
      version: 1,
    },
  ),
)
