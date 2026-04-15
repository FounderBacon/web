"use client"

import type { CalculatedStats } from "@/lib/types/calculate"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import {
  STAT_DESC,
  STAT_MAX,
  DPS_DESC,
  bonusColor,
  formatStatName,
} from "@/lib/constants"

interface StatsColumnProps {
  baseStats: CalculatedStats | null
  modifiedStats: CalculatedStats | null
  isRanged: boolean
  loading?: boolean
}

const BASIC_STATS_RANGED = ["damage", "dps", "firingRate", "clipSize", "reloadTime", "durability"] as const
const BASIC_STATS_MELEE = ["damage", "dps", "attackSpeed", "durability"] as const
const COMBAT_STATS = ["impactDamage", "envDamage", "headshotMultiplier", "knockback", "stunTime"] as const
const ACCURACY_STATS = ["spread", "spreadADS"] as const
const RANGE_STATS = ["rangePB", "rangeMid", "rangeLong", "rangeMax", "isHitscan"] as const
const AMMO_STATS = ["maxSpareAmmo", "ammoCost"] as const
const DURABILITY_STATS = ["durability", "durabilityPerUse", "totalShots", "totalHits"] as const
const MELEE_STATS = ["attackSpeed", "swingTime", "swingPlaySpeed", "range", "coneAngle", "conePitch"] as const

export function StatsColumn({ baseStats, modifiedStats, isRanged, loading }: StatsColumnProps) {
  if (!baseStats || !modifiedStats) {
    return (
      <div className="overflow-hidden border border-border/50">
        <div className="border-b border-border/50 bg-card px-4 py-2">
          <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Stats</p>
        </div>
        <div className="flex min-h-60 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      </div>
    )
  }

  const base = baseStats as unknown as Record<string, unknown>
  const modified = modifiedStats as unknown as Record<string, unknown>

  const hasPerks = baseStats !== modifiedStats

  const dpsMetrics = [
    { label: "DPS", value: modifiedStats.dps, base: baseStats.dps },
    { label: "Crit DPS", value: modifiedStats.critDps, base: baseStats.critDps },
    { label: "Avg DPS", value: modifiedStats.avgDps, base: baseStats.avgDps },
    { label: "HS DPS", value: modifiedStats.headshotDps, base: baseStats.headshotDps },
    { label: "Hit", value: modifiedStats.damage, base: baseStats.damage },
    { label: "Crit Hit", value: modifiedStats.damage * (1 + modifiedStats.critDamageMultiplier / 100), base: baseStats.damage * (1 + baseStats.critDamageMultiplier / 100) },
    { label: "Crit %", value: modifiedStats.critChance, base: baseStats.critChance, suffix: "%" },
    { label: "Crit x", value: modifiedStats.critDamageMultiplier, base: baseStats.critDamageMultiplier, suffix: "%" },
  ].filter((m) => typeof m.value === "number" && typeof m.base === "number" && !Number.isNaN(m.value) && !Number.isNaN(m.base))

  const basicStats = isRanged ? BASIC_STATS_RANGED : BASIC_STATS_MELEE

  const groups: { id: string; title: string; stats: readonly string[] }[] = [
    { id: "basic", title: "Basic", stats: basicStats },
    { id: "dps", title: "Damage Profile", stats: [] },
    { id: "combat", title: "Combat", stats: COMBAT_STATS },
    ...(isRanged
      ? [
          { id: "accuracy", title: "Accuracy", stats: ACCURACY_STATS },
          { id: "range", title: "Range", stats: RANGE_STATS },
          { id: "ammo", title: "Ammo", stats: AMMO_STATS },
        ]
      : [{ id: "melee", title: "Melee", stats: MELEE_STATS }]),
    { id: "durability", title: "Durability", stats: DURABILITY_STATS },
  ]

  return (
    <div className={`overflow-hidden border border-border/50 transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}>
      <div className="border-b border-border/50 bg-card px-4 py-2">
        <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Stats</p>
      </div>
      <div className="p-4">
      <Accordion type="multiple" defaultValue={["basic", "dps"]} className="w-full">
        {groups.map((group) => {
          if (group.id === "dps") {
            return (
              <AccordionItem key={group.id} value={group.id} className="border-border/50">
                <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
                  {group.title}
                </AccordionTrigger>
                <AccordionContent>
                  {/* Avg DPS */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums text-foreground">{fmt(modifiedStats.avgDps)}</span>
                      {hasPerks && Math.abs(modifiedStats.avgDps - baseStats.avgDps) > 0.01 && (
                        <span className={`text-base font-semibold ${bonusColor(modifiedStats.avgDps - baseStats.avgDps)}`}>
                          {modifiedStats.avgDps - baseStats.avgDps > 0 ? "+" : ""}{fmt(modifiedStats.avgDps - baseStats.avgDps)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Avg DPS</p>
                  </div>
                  <div className="space-y-0.5">
                    {dpsMetrics.map((m) => (
                      <DpsStatRow key={m.label} label={m.label} value={m.value} base={m.base} suffix={m.suffix} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          }

          const presentStats = group.stats.filter((k) => k in base)
          if (presentStats.length === 0) return null

          return (
            <AccordionItem key={group.id} value={group.id} className="border-border/50">
              <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
                {group.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {presentStats.map((key) => (
                    <StatRow key={key} statKey={key} baseVal={base[key]} modifiedVal={modified[key]} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
      </div>
    </div>
  )
}

function DpsStatRow({
  label,
  value,
  base,
  suffix = "",
}: {
  label: string
  value: number
  base: number
  suffix?: string
}) {
  const change = value - base
  const hasChange = Math.abs(change) > 0.01
  const desc = DPS_DESC[label]

  return (
    <div className="flex items-baseline gap-2 py-0.5">
      <span className="min-w-0 flex-1"><DpsLabel label={label} desc={desc} /></span>
      <span className="shrink-0 text-right text-lg font-bold tabular-nums text-foreground">
        {fmt(value)}{suffix}
      </span>
      <span className={`w-16 shrink-0 text-right text-base tabular-nums ${hasChange ? bonusColor(change) : "text-common-dark dark:text-common"}`}>
        {hasChange && (suffix === "%" ? (change > 0 ? "+" : "") : (change > 0 ? "+" : ""))}
        {hasChange ? fmt(change) + suffix : "0"}
      </span>
    </div>
  )
}

function DpsLabel({ label, desc }: { label: string; desc?: string }) {
  if (!desc) return <span className="text-sm text-muted-foreground">{label}</span>

  return (
    <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help text-sm text-muted-foreground underline decoration-dotted underline-offset-4">
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-sm">{desc}</p>
        </TooltipContent>
      </Tooltip>
  )
}

function StatRow({
  statKey,
  baseVal,
  modifiedVal,
}: {
  statKey: string
  baseVal: unknown
  modifiedVal: unknown
}) {
  if (typeof baseVal === "string" || typeof baseVal === "boolean") {
    return (
      <div className="flex items-center justify-between py-0.5">
        <StatLabel statKey={statKey} />
        <span className="text-base font-medium text-foreground">
          {typeof baseVal === "boolean" ? (baseVal ? "Yes" : "No") : baseVal}
        </span>
      </div>
    )
  }

  const base = baseVal as number
  const current = modifiedVal as number
  const max = STAT_MAX[statKey] ?? Math.max(base * 2, 100)

  const baseWidth = Math.min((base / max) * 100, 100)
  const modWidth = Math.min((current / max) * 100, 100)
  const hasModification = Math.abs(current - base) > 0.001
  const delta = current - base

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="min-w-0 flex-1"><StatLabel statKey={statKey} /></span>
        <span className={`shrink-0 text-right text-lg font-bold tabular-nums ${hasModification ? bonusColor(delta) : "text-foreground"}`}>
          {fmt(current)}
        </span>
        <span className={`w-16 shrink-0 text-right text-base tabular-nums ${hasModification ? bonusColor(delta) : "text-common-dark dark:text-common"}`}>
          {hasModification ? (delta > 0 ? "+" : "") + fmt(delta) : "0"}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-sm bg-king-800/30 dark:bg-king-50/15">
        <div className="absolute inset-y-0 left-0 rounded-sm bg-primary/40 transition-all duration-200" style={{ width: `${baseWidth}%` }} />
        <div className="absolute inset-y-0 rounded-sm bg-uncommon transition-all duration-200" style={{ left: `${baseWidth}%`, width: `${delta > 0 ? modWidth - baseWidth : 0}%` }} />
        <div className="absolute inset-y-0 rounded-sm bg-malus transition-all duration-200" style={{ left: `${delta < 0 ? modWidth : baseWidth}%`, width: `${delta < 0 ? baseWidth - modWidth : 0}%` }} />
      </div>
    </div>
  )
}

function StatLabel({ statKey }: { statKey: string }) {
  const desc = STAT_DESC[statKey]
  const label = formatStatName(statKey)

  if (!desc) return <span className="text-sm text-muted-foreground">{label}</span>

  return (
    <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help text-sm text-muted-foreground underline decoration-dotted underline-offset-4">
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-sm">{desc}</p>
        </TooltipContent>
      </Tooltip>
  )
}

function fmt(n: number | undefined | null): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "—"
  return n % 1 === 0 ? String(n) : n.toFixed(2)
}
