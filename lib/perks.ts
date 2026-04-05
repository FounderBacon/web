import type { Perk } from "@/lib/types/weapon"

export interface PerkBonus {
  stat: string
  value: number
  unit: "%" | "flat"
  raw: string
}

const STAT_MAP: Record<string, string> = {
  "damage": "damage",
  "crit damage": "critMultiplier",
  "critical rating": "critChance",
  "fire rate": "firingRate",
  "reload speed": "reloadSpeed",
  "magazine size": "clipSize",
  "durability": "durability",
  "headshot damage": "headshotMultiplier",
  "weapon stability": "stability",
  "impact": "impactDamage",
}

// Stats ou la formule est inversee : +% speed = -% temps
const INVERSE_STATS = new Set(["reloadSpeed"])

export function parsePerkBonuses(perk: Perk): PerkBonus[] {
  const bonuses: PerkBonus[] = []
  const desc = perk.description

  const percentMatch = desc.matchAll(/([+-][\d.]+)%\s+(.+?)(?:\.|$)/gi)
  for (const m of percentMatch) {
    const value = parseFloat(m[1])
    const label = m[2].trim().toLowerCase()
    const stat = STAT_MAP[label]
    if (stat) {
      bonuses.push({ stat, value, unit: "%", raw: `${m[1]}% ${m[2].trim()}` })
    } else {
      bonuses.push({ stat: label, value, unit: "%", raw: `${m[1]}% ${m[2].trim()}` })
    }
  }

  const flatMatch = desc.matchAll(/([+-][\d.]+)\s+(?!%)(Critical Rating|Impact)/gi)
  for (const m of flatMatch) {
    const value = parseFloat(m[1])
    const label = m[2].trim().toLowerCase()
    const stat = STAT_MAP[label] ?? label
    bonuses.push({ stat, value, unit: "flat", raw: `${m[1]} ${m[2].trim()}` })
  }

  return bonuses
}

export function isInverseStat(stat: string): boolean {
  return INVERSE_STATS.has(stat)
}

export function formatBonusValue(bonus: PerkBonus): string {
  const sign = bonus.value > 0 ? "+" : ""
  return bonus.unit === "%" ? `${sign}${bonus.value}%` : `${sign}${bonus.value}`
}

// ── Bonus calculation (partage entre StatsPanel et DpsCalculator) ──

import { BONUS_TO_STAT } from "@/lib/constants"

export interface BonusEntry {
  percent: number
  flat: number
  inverse?: boolean
}

export function buildBonusMap(perks: Record<number, Perk | null>): Record<string, BonusEntry> {
  const map: Record<string, BonusEntry> = {}
  for (const perk of Object.values(perks)) {
    if (!perk) continue
    for (const b of parsePerkBonuses(perk)) {
      const statKey = BONUS_TO_STAT[b.stat] ?? b.stat
      if (!map[statKey]) map[statKey] = { percent: 0, flat: 0, inverse: isInverseStat(b.stat) }
      if (b.unit === "%") map[statKey].percent += b.value
      else map[statKey].flat += b.value
    }
  }
  return map
}

export function applyBonus(base: number, bonus: BonusEntry): number {
  if (bonus.inverse) {
    return Math.round((base / (1 + bonus.percent / 100) + bonus.flat) * 100) / 100
  }
  return Math.round((base * (1 + bonus.percent / 100) + bonus.flat) * 100) / 100
}

export function applyBonusOrBase(base: number, bonus: BonusEntry | undefined): number {
  if (!bonus) return base
  return applyBonus(base, bonus)
}
