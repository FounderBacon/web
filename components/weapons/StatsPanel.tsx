"use client"

import { useState } from "react"
import type { TierData, Perk } from "@/lib/types/weapon"
import { buildBonusMap, applyBonus, type BonusEntry } from "@/lib/perks"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { STAT_DESC, STAT_MAX, MAIN_STATS, STAT_GROUPS, bonusColor, formatStatName } from "@/lib/constants"

interface StatsPanelProps {
  tierData: TierData
  selectedPerks: Record<number, Perk | null>
  previewPerk?: Perk | null
}

export function StatsPanel({ tierData, selectedPerks, previewPerk }: StatsPanelProps) {
  if (!tierData.stats) return null

  const allStats = tierData.stats as unknown as Record<string, unknown>
  const bonusMap = buildBonusMap(selectedPerks)
  const previewMap = previewPerk ? buildBonusMap({ 99: previewPerk }) : {}

  const mainEntries = MAIN_STATS.filter((k) => k in allStats)
  const grouped: Record<string, string[]> = {}

  for (const [group, keys] of Object.entries(STAT_GROUPS)) {
    const present = keys.filter((k) => k in allStats && !(MAIN_STATS as readonly string[]).includes(k))
    if (present.length > 0) grouped[group] = present
  }

  const categorized = new Set([...MAIN_STATS, ...Object.values(STAT_GROUPS).flat()])
  const uncategorized = Object.keys(allStats).filter((k) => !categorized.has(k))
  if (uncategorized.length > 0) {
    grouped["Other"] = [...(grouped["Other"] ?? []), ...uncategorized]
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {mainEntries.map((key) => (
          <StatRow key={key} statKey={key} val={allStats[key]} bonusMap={bonusMap} previewMap={previewMap} />
        ))}
      </div>

      {Object.entries(grouped).map(([group, keys]) => (
        <Accordion key={group} title={group}>
          {keys.map((key) => (
            <StatRow key={key} statKey={key} val={allStats[key]} bonusMap={bonusMap} previewMap={previewMap} />
          ))}
        </Accordion>
      ))}
    </div>
  )
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between border-b border-border py-1.5"
      >
        <span className="font-akkordeon-11 text-sm uppercase text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  )
}

function StatLabel({ statKey }: { statKey: string }) {
  const desc = STAT_DESC[statKey]
  const label = formatStatName(statKey)

  if (!desc) return <span className="text-sm text-foreground">{label}</span>

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help text-sm text-foreground underline decoration-dotted underline-offset-4">{label}</span>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">{desc}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function StatRow({ statKey, val, bonusMap, previewMap }: { statKey: string; val: unknown; bonusMap: Record<string, BonusEntry>; previewMap: Record<string, BonusEntry> }) {
  if (typeof val === "string" || typeof val === "boolean") {
    return (
      <div className="flex items-center justify-between py-1">
        <StatLabel statKey={statKey} />
        <span className="text-sm font-medium text-foreground">{typeof val === "boolean" ? (val ? "Yes" : "No") : val}</span>
      </div>
    )
  }

  const base = val as number
  const bonus = bonusMap[statKey]
  const modified = bonus ? applyBonus(base, bonus) : base
  const preview = previewMap[statKey]
  const previewed = preview ? applyBonus(modified, preview) : modified
  const max = STAT_MAX[statKey] ?? Math.max(base * 2, 100)

  const baseWidth = Math.min((base / max) * 100, 100)
  const modWidth = Math.min((modified / max) * 100, 100)
  const prevWidth = Math.min((previewed / max) * 100, 100)
  const hasModification = modified !== base
  const hasPreview = previewed !== modified
  const delta = modified - base
  const previewDelta = previewed - modified

  return (
    <div>
      {/* Nom + valeurs sur la meme ligne */}
      <div className="flex items-baseline justify-between mb-0.5">
        <StatLabel statKey={statKey} />
        <div className="flex items-baseline gap-1">
          <span className={`text-base font-semibold ${hasModification ? bonusColor(delta) : "text-foreground"}`}>{fmt(modified)}</span>
          {hasModification && (
            <span className={`text-xs ${bonusColor(delta)}`}>{delta > 0 ? "+" : ""}{fmt(delta)}</span>
          )}
          {!hasModification && (
            <span className="text-xs text-common-dark">+0</span>
          )}
          {hasPreview && (
            <span className={`text-xs ${bonusColor(previewDelta)}`}>({previewDelta > 0 ? "+" : ""}{fmt(previewDelta)})</span>
          )}
        </div>
      </div>

      {/* Barre en dessous */}
      <div className="relative h-3 w-full overflow-hidden bg-foreground/10">
        {/* Barre de base */}
        <div className="absolute inset-y-0 left-0 bg-foreground" style={{ width: `${baseWidth}%` }} />
        {/* Bonus positif : vert apres la base */}
        {hasModification && delta > 0 && (
          <div className="absolute inset-y-0 bg-uncommon transition-all duration-200" style={{ left: `${baseWidth}%`, width: `${modWidth - baseWidth}%` }} />
        )}
        {/* Bonus negatif : orange sur la partie perdue */}
        {hasModification && delta < 0 && (
          <div className="absolute inset-y-0 bg-malus transition-all duration-200" style={{ left: `${modWidth}%`, width: `${baseWidth - modWidth}%` }} />
        )}
        {/* Preview hover positif */}
        {hasPreview && previewDelta > 0 && (
          <div className="absolute inset-y-0 bg-uncommon/50 transition-all duration-150" style={{ left: `${modWidth}%`, width: `${prevWidth - modWidth}%` }} />
        )}
        {/* Preview hover negatif */}
        {hasPreview && previewDelta < 0 && (
          <div className="absolute inset-y-0 bg-malus/50 transition-all duration-150" style={{ left: `${prevWidth}%`, width: `${modWidth - prevWidth}%` }} />
        )}
      </div>
    </div>
  )
}

function fmt(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2)
}
