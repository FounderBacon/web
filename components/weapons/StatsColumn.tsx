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
import { formatStat } from "@/lib/format"

interface StatsColumnProps {
  baseStats: CalculatedStats | null
  heroStats?: CalculatedStats | null
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

export function StatsColumn({ baseStats, heroStats, modifiedStats, isRanged, loading }: StatsColumnProps) {
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
  const hero = (heroStats ?? baseStats) as unknown as Record<string, unknown>
  const modified = modifiedStats as unknown as Record<string, unknown>

  const hasPerks = (heroStats ?? baseStats) !== modifiedStats

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
                    <StatRow key={key} statKey={key} baseVal={base[key]} heroVal={hero[key]} modifiedVal={modified[key]} />
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
      <span className={`w-24 shrink-0 text-right text-base tabular-nums ${hasChange ? bonusColor(change) : "text-common-dark dark:text-common"}`}>
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
  heroVal,
  modifiedVal,
}: {
  statKey: string
  baseVal: unknown
  heroVal: unknown
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
  const hero = (typeof heroVal === "number" ? heroVal : base) as number
  const current = modifiedVal as number
  // Le max doit toujours laisser de la marge au-dessus du current pour que les bonus restent visibles.
  // STAT_MAX est une reference theorique — on l'ignore si la valeur reelle la depasse.
  const max = Math.max(STAT_MAX[statKey] ?? 0, current * 1.15, base * 1.15, 1)

  const heroDelta = hero - base
  const perksDelta = current - hero
  const totalDelta = current - base
  const hasModification = Math.abs(totalDelta) > 0.001

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="min-w-0 flex-1"><StatLabel statKey={statKey} /></span>
        <span className={`shrink-0 text-right text-lg font-bold tabular-nums ${hasModification ? bonusColor(totalDelta) : "text-foreground"}`}>
          {fmt(current)}
        </span>
        <span className={`w-24 shrink-0 text-right text-base tabular-nums ${hasModification ? bonusColor(totalDelta) : "text-common-dark dark:text-common"}`}>
          {hasModification ? (totalDelta > 0 ? "+" : "") + fmt(totalDelta) : "0"}
        </span>
      </div>
      <StackedBar statKey={statKey} base={base} hero={hero} current={current} max={max} />
    </div>
  )
}

// Jauge a 3 segments avec tooltip detaillant le breakdown
function StackedBar({ statKey, base, hero, current, max }: { statKey: string; base: number; hero: number; current: number; max: number }) {
  const pct = (n: number) => Math.max(0, Math.min((n / max) * 100, 100))
  const heroDelta = hero - base
  const perksDelta = current - hero

  const baseW = pct(base)
  const heroW = pct(hero)
  const modW = pct(current)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative h-2 w-full cursor-help overflow-hidden rounded-sm bg-king-800/30 dark:bg-king-50/15">
          <div className="absolute inset-y-0 left-0 rounded-sm bg-primary/40 transition-all duration-200" style={{ width: `${Math.min(baseW, heroW, modW)}%` }} />
          {heroDelta > 0 && (
            <div className="absolute inset-y-0 rounded-sm bg-legendary transition-all duration-200" style={{ left: `${baseW}%`, width: `${Math.max(0, Math.min(heroW, modW) - baseW)}%` }} />
          )}
          {perksDelta > 0 && (
            <div className="absolute inset-y-0 rounded-sm bg-uncommon transition-all duration-200" style={{ left: `${heroW}%`, width: `${Math.max(0, modW - heroW)}%` }} />
          )}
          {heroDelta < 0 && (
            <div className="absolute inset-y-0 rounded-sm bg-malus transition-all duration-200" style={{ left: `${Math.max(heroW, modW)}%`, width: `${Math.max(0, baseW - Math.max(heroW, modW))}%` }} />
          )}
          {perksDelta < 0 && (
            <div className="absolute inset-y-0 rounded-sm bg-malus transition-all duration-200" style={{ left: `${modW}%`, width: `${Math.max(0, heroW - modW)}%` }} />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="min-w-44">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold">{formatStatName(statKey)}</p>
          <BreakdownRow color="bg-primary/60" label="Base" value={fmt(base)} />
          {heroDelta !== 0 && (
            <BreakdownRow
              color="bg-legendary-dark dark:bg-legendary"
              label="Heroes"
              value={(heroDelta > 0 ? "+" : "") + fmt(heroDelta)}
              valueClass={bonusColor(heroDelta)}
            />
          )}
          {perksDelta !== 0 && (
            <BreakdownRow
              color="bg-uncommon-dark dark:bg-uncommon"
              label="Perks"
              value={(perksDelta > 0 ? "+" : "") + fmt(perksDelta)}
              valueClass={bonusColor(perksDelta)}
            />
          )}
          <div className="mt-0.5 flex items-center justify-between border-t border-border/40 pt-1 text-xs font-bold">
            <span>Total</span>
            <span className="tabular-nums">{fmt(current)}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function BreakdownRow({ color, label, value, valueClass }: { color: string; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="flex items-center gap-1.5">
        <span className={`size-2 rounded-sm ${color}`} />
        <span className="text-muted-foreground">{label}</span>
      </span>
      <span className={`tabular-nums ${valueClass ?? ""}`}>{value}</span>
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

const fmt = formatStat
