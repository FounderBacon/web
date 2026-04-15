"use client"

import { useState } from "react"
import type { WeaponDetail, TierEntry } from "@/lib/types/weapon"
import { isTierSplit } from "@/lib/types/weapon"

interface TierSelectorProps {
  weapon: WeaponDetail
  tier: string
  material: "ore" | "crystal"
  hasSplit: boolean
  level: number
  offensive: number
  onTierChange: (tier: string) => void
  onMaterialChange: (material: "ore" | "crystal") => void
  onLevelChange: (level: number) => void
  onOffensiveChange: (offensive: number) => void
}

const SHORT_NAMES: Record<string, string> = {
  copper: "Copper",
  silver: "Silver",
  malachite: "Mala.",
  obsidian: "Obsi.",
  shadowshard: "Shadow.",
  brightcore: "Bright.",
  sunbeam: "Sun.",
}

function shortTier(name: string): string {
  return SHORT_NAMES[name.toLowerCase()] ?? name
}

export function TierSelector({
  weapon,
  tier,
  material,
  hasSplit,
  level,
  offensive,
  onTierChange,
  onMaterialChange,
  onLevelChange,
  onOffensiveChange,
}: TierSelectorProps) {
  const anySplit = Object.values(weapon.tiers).some((entry) => entry && isTierSplit(entry))
  const tierKeys = Object.keys(weapon.tiers)

  const activeEntry: TierEntry | undefined = weapon.tiers[tier]
  const activeTd = activeEntry ? (isTierSplit(activeEntry) ? activeEntry[material] : activeEntry) : null
  const levelMin = activeTd?.levelRange?.min ?? 1
  const levelMax = activeTd?.levelRange?.max ?? 50

  const [localLevel, setLocalLevel] = useState<string>(String(level))
  const [localOffensive, setLocalOffensive] = useState<string>(String(offensive))

  // Sync quand les props changent (ex: changement de tier)
  if (Number(localLevel) !== level && !document.activeElement?.closest("[data-level-input]")) {
    setLocalLevel(String(level))
  }

  function commitLevel(raw: string) {
    const n = Math.max(levelMin, Math.min(levelMax, parseInt(raw, 10) || levelMin))
    setLocalLevel(String(n))
    onLevelChange(n)
  }

  function commitOffensive(raw: string) {
    const n = Math.max(0, parseInt(raw, 10) || 0)
    setLocalOffensive(String(n))
    onOffensiveChange(n)
  }

  return (
    <div className="mb-4 overflow-hidden border border-border/50">
      <div className="flex items-center justify-between border-b border-border/50 bg-card px-4 py-2">
        <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Tier</p>
        {activeTd && (
          <span className="text-base">
            {activeTd.displayTier && (
              <>
                <span className="font-semibold capitalize text-primary">{activeTd.displayTier}</span>
                {" "}
              </>
            )}
            {activeTd.levelRange && (
              <span className="font-medium text-foreground">Lv.{activeTd.levelRange.min}-{activeTd.levelRange.max}</span>
            )}
          </span>
        )}
      </div>
      <div className="space-y-2 p-3">
        {/* Tiers */}
        <div className={`grid gap-1 ${gridCols(tierKeys.length)}`}>
          {tierKeys.map((t) => {
            const entry: TierEntry | undefined = weapon.tiers[t]
            const td = entry ? (isTierSplit(entry) ? entry[material] : entry) : null
            const isActive = tier === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => onTierChange(t)}
                className={`cursor-pointer border py-1.5 text-center text-xs font-semibold capitalize transition-all ${
                  isActive
                    ? "border-primary bg-primary/20 text-foreground"
                    : "border-border/50 bg-muted/60 text-foreground/60 hover:bg-muted hover:text-foreground"
                }`}
              >
                {td?.displayTier ? shortTier(td.displayTier) : `T${t}`}
              </button>
            )
          })}
        </div>

        {/* Material */}
        {anySplit && (
          <div className="grid grid-cols-2 gap-1">
            {(["ore", "crystal"] as const).map((m) => {
              const isActive = material === m && hasSplit
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onMaterialChange(m)}
                  disabled={!hasSplit}
                  className={`cursor-pointer border py-1.5 text-center text-xs font-medium capitalize transition-all disabled:cursor-default disabled:opacity-30 ${
                    isActive
                      ? "border-primary bg-primary/20 text-foreground"
                      : "border-border/50 bg-muted/60 text-foreground/60 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              )
            })}
          </div>
        )}

        {/* Level + Offensive */}
        <div className="grid grid-cols-2 gap-2">
          <div data-level-input>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Level
            </label>
            <input
              type="number"
              min={levelMin}
              max={levelMax}
              value={localLevel}
              onChange={(e) => setLocalLevel(e.target.value)}
              onBlur={(e) => commitLevel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitLevel((e.target as HTMLInputElement).value) }}
              className="w-full border border-border/50 bg-muted/60 px-3 py-1.5 text-center text-xs font-semibold tabular-nums text-foreground outline-none transition-colors focus:border-primary focus:bg-primary/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Offensive
            </label>
            <input
              type="number"
              min={0}
              value={localOffensive}
              onChange={(e) => setLocalOffensive(e.target.value)}
              onBlur={(e) => commitOffensive(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitOffensive((e.target as HTMLInputElement).value) }}
              className="w-full border border-border/50 bg-muted/60 px-3 py-1.5 text-center text-xs font-semibold tabular-nums text-foreground outline-none transition-colors focus:border-primary focus:bg-primary/10"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function gridCols(count: number): string {
  switch (count) {
    case 1: return "grid-cols-1"
    case 2: return "grid-cols-2"
    case 3: return "grid-cols-3"
    case 4: return "grid-cols-4"
    case 5: return "grid-cols-5"
    case 6: return "grid-cols-6"
    default: return "grid-cols-5"
  }
}
