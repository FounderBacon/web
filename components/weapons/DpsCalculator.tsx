"use client"

import type { TierData, Perk } from "@/lib/types/weapon"
import { buildBonusMap, applyBonusOrBase } from "@/lib/perks"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DPS_DESC, bonusColor } from "@/lib/constants"

interface DpsCalculatorProps {
  tierData: TierData
  selectedPerks: Record<number, Perk | null>
  isRanged: boolean
}

export function DpsCalculator({ tierData, selectedPerks, isRanged }: DpsCalculatorProps) {
  if (!tierData.stats) return null

  const stats = tierData.stats as unknown as Record<string, number>
  const bonuses = buildBonusMap(selectedPerks)

  const damage = applyBonusOrBase(stats.damage ?? 0, bonuses.damage)
  const critChance = Math.min(applyBonusOrBase(stats.critChance ?? 0, bonuses.critChance), 1)
  const critMult = applyBonusOrBase(stats.critMultiplier ?? 1, bonuses.critMultiplier)
  const headshotMult = stats.headshotMultiplier ?? 1
  const firingRate = isRanged ? applyBonusOrBase(stats.firingRate ?? 1, bonuses.firingRate) : applyBonusOrBase(stats.attackSpeed ?? 1, bonuses.attackSpeed)

  const avgDamage = damage * (1 + critChance * (critMult - 1))
  const dps = avgDamage * firingRate
  const headshotDps = avgDamage * headshotMult * firingRate

  const baseDamage = stats.damage ?? 0
  const baseCritChance = Math.min(stats.critChance ?? 0, 1)
  const baseCritMult = stats.critMultiplier ?? 1
  const baseRate = isRanged ? (stats.firingRate ?? 1) : (stats.attackSpeed ?? 1)
  const baseAvgDamage = baseDamage * (1 + baseCritChance * (baseCritMult - 1))
  const baseDps = baseAvgDamage * baseRate
  const baseHeadshotDps = baseAvgDamage * headshotMult * baseRate
  const dpsChange = dps - baseDps

  const rawDps = damage * firingRate
  const baseRawDps = baseDamage * baseRate
  const critDps = damage * critMult * firingRate
  const baseCritDps = baseDamage * baseCritMult * baseRate

  return (
    <div className="flex flex-col gap-3">
      <DpsStat label="DPS" value={rawDps} base={baseRawDps} change={rawDps - baseRawDps} />
      <DpsStat label="Crit DPS" value={critDps} base={baseCritDps} change={critDps - baseCritDps} />
      <DpsStat label="Avg DPS" value={dps} base={baseDps} change={dpsChange} />
      <DpsStat label="HS DPS" value={headshotDps} base={baseHeadshotDps} change={headshotDps - baseHeadshotDps} />
      <div className="border-t border-border/30 pt-2" />
      <DpsStat label="Hit" value={damage} base={baseDamage} change={damage - baseDamage} />
      <DpsStat label="Crit Hit" value={damage * critMult} base={baseDamage * baseCritMult} change={damage * critMult - baseDamage * baseCritMult} />
      <DpsStat label="Crit %" value={critChance * 100} base={baseCritChance * 100} change={(critChance - baseCritChance) * 100} suffix="%" />
      <DpsStat label="Crit x" value={critMult} base={baseCritMult} change={critMult - baseCritMult} suffix="x" />
    </div>
  )
}

function DpsStat({ label, value, base, change, suffix = "" }: { label: string; value: number; base?: number; change?: number; suffix?: string }) {
  const hasChange = change !== undefined && Math.abs(change) > 0.01
  const desc = DPS_DESC[label]

  return (
    <div>
      {desc ? (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block cursor-help text-xs text-muted-foreground underline decoration-dotted underline-offset-4">{label}</span>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">{desc}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className="block text-xs text-muted-foreground">{label}</span>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-semibold text-foreground">{fmt(value)}{suffix}</span>
        {hasChange && (
          <span className={`text-xs ${bonusColor(change!)}`}>
            {change! > 0 ? "+" : ""}{fmt(change!)}
          </span>
        )}
      </div>
    </div>
  )
}

function fmt(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}
