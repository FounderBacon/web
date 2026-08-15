import type { Perk, PerkSlot } from "@/lib/types/weapon"

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

// Extrait le(s) stat name(s) d'un perk sans la valeur (ex: "+42% Damage" -> "Damage").
// Sert au picker de perks pour montrer le TYPE de stat, indep du tier choisi.
// Fallback sur perk.name (puis la description) si on ne sait pas parser.
export function extractStatLabel(perk: Perk): string {
  // "Element: Physical and +20% Damage" -> "Physical Rounds", pas "Damage"
  if (perk.description.startsWith("Element:")) return perkDisplayName(perk)
  const bonuses = parsePerkBonuses(perk)
  if (bonuses.length === 0) return perkDisplayName(perk)
  return bonuses.map((b) => b.raw.replace(/^[+-]?[\d.]+%?\s+/, "")).join(" + ")
}

// Certains perks n'ont pas de name en base (ex: aid_g_static_autoreload) : on retombe sur la description.
export function perkDisplayName(perk: Perk): string {
  return perk.name || perk.description
}

// ── Groupement des tiers d'un perk (t01..t05) ──

export interface PerkGroup {
  name: string
  tiers: Perk[]
}

// Groupe par name ; sans name, par perkId sans suffixe de tier pour ne pas perdre le perk.
export function groupPerks(perks: Perk[]): PerkGroup[] {
  const map = new Map<string, Perk[]>()
  for (const perk of perks) {
    const key = perk.name || perk.perkId.replace(/_t\d+$/, "")
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(perk)
  }
  return Array.from(map.entries()).map(([name, tiers]) => ({ name, tiers }))
}

// ── Slot du perk unique de l'arme ──

// Le perk unique de l'arme est le slot dont tous les perks sont "gameplay" (aid_g_*).
// Le plus souvent c'est le dernier slot, mais pas toujours (ex: Chaos Exploder, Storm King,
// Black Drum : slot 0 au Lv.0). Sans slot gameplay (pieges, quelques communes), on garde le dernier.
export function splitPerkSlots(slots: PerkSlot[]): { buildSlots: PerkSlot[]; weaponSlot: PerkSlot | null } {
  if (slots.length === 0) return { buildSlots: [], weaponSlot: null }
  const gameplayIndex = slots.findIndex(
    (s) => s.availablePerks.length > 0 && s.availablePerks.every((p) => p.type === "gameplay"),
  )
  const index = gameplayIndex >= 0 ? gameplayIndex : slots.length - 1
  return { buildSlots: slots.filter((_, i) => i !== index), weaponSlot: slots[index] }
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
