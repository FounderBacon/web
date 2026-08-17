import type { CalculatedStats } from "@/lib/types/calculate"

// ── Direction des stats ──────────────────────────────────────────
// Certaines stats sont meilleures quand elles baissent (reload, spread, recul).
// Sans cette table, un gain de -0.4s au rechargement s'afficherait en rouge.

const LOWER_IS_BETTER = new Set([
  "reloadTime",
  "spread",
  "spreadADS",
  "recoilVertical",
  "recoilHorizontal",
  "recoilADSMultiplier",
  "standingStillSpreadMult",
  "ammoCost",
  "durabilityPerUse",
  "swingTime",
  "minChargeTime",
  "maxChargeTime",
  "overheatHeatingValue",
])

export function isLowerBetter(key: string): boolean {
  return LOWER_IS_BETTER.has(key)
}

// ── Stats comparables ────────────────────────────────────────────
// Regroupees comme sur la fiche arme pour garder la meme lecture.
// Une ligne n'est affichee que si au moins une arme porte la valeur,
// ce qui gere naturellement le melange ranged/melee.

export interface CompareStatGroup {
  label: string
  keys: string[]
}

export const COMPARE_GROUPS: CompareStatGroup[] = [
  {
    label: "Damage",
    keys: ["damage", "dps", "critDps", "avgDps", "headshotDps", "critHeadshot", "headshotDamage"],
  },
  {
    label: "Crit",
    keys: ["critChance", "critDamageMultiplier", "headshotMultiplier"],
  },
  {
    label: "Combat",
    keys: ["impactDamage", "envDamage", "knockback", "stunTime"],
  },
  {
    label: "Handling",
    keys: ["firingRate", "clipSize", "reloadTime", "maxSpareAmmo", "ammoCost"],
  },
  {
    label: "Accuracy",
    keys: ["spread", "spreadADS"],
  },
  {
    label: "Range",
    keys: ["rangePB", "rangeMid", "rangeLong", "rangeMax"],
  },
  {
    label: "Melee",
    keys: ["attackSpeed", "swingTime", "swingPlaySpeed", "range", "coneAngle", "conePitch"],
  },
  {
    label: "Durability",
    keys: ["durability", "durabilityPerUse", "totalShots", "totalHits"],
  },
]

// Libelles propres aux stats calculees, absentes de STAT_LABELS.
export const COMPARE_STAT_LABELS: Record<string, string> = {
  critDps: "Crit DPS",
  avgDps: "Avg DPS",
  headshotDps: "HS DPS",
  headshotDamage: "Headshot Damage",
  critHeadshot: "Crit Headshot",
  critDamageMultiplier: "Crit Multiplier",
  spread: "Spread",
  spreadADS: "Spread ADS",
  rangePB: "Range (point blank)",
  rangeMid: "Range (mid)",
  rangeLong: "Range (long)",
  rangeMax: "Range (max)",
  knockback: "Knockback",
  stunTime: "Stun Time",
  swingTime: "Swing Time",
  swingPlaySpeed: "Swing Speed",
  range: "Range",
  coneAngle: "Cone Angle",
  conePitch: "Cone Pitch",
}

// Stats exprimees en pourcentage cote API.
const PERCENT_STATS = new Set(["critChance", "critDamageMultiplier", "headshotMultiplier"])

export function isPercentStat(key: string): boolean {
  return PERCENT_STATS.has(key)
}

// Stats exprimees en secondes.
const SECOND_STATS = new Set(["reloadTime", "swingTime", "stunTime"])

export function statSuffix(key: string): string {
  if (isPercentStat(key)) return "%"
  if (SECOND_STATS.has(key)) return "s"
  return ""
}

// ── Extraction ───────────────────────────────────────────────────

export function readStat(stats: CalculatedStats | null, key: string): number | null {
  if (!stats) return null
  const value = (stats as unknown as Record<string, unknown>)[key]
  return typeof value === "number" && !Number.isNaN(value) ? value : null
}

// ── Delta ────────────────────────────────────────────────────────

export interface StatDelta {
  key: string
  label: string
  suffix: string
  values: (number | null)[]
  // Index de la meilleure valeur, null si egalite ou comparaison impossible.
  bestIndex: number | null
  // Ecart relatif de chaque arme par rapport a la premiere, en %.
  percentFromFirst: (number | null)[]
}

function labelFor(key: string, fallback: (key: string) => string): string {
  return COMPARE_STAT_LABELS[key] ?? fallback(key)
}

export function buildDelta(
  key: string,
  columns: (CalculatedStats | null)[],
  fallbackLabel: (key: string) => string,
): StatDelta | null {
  const values = columns.map((stats) => readStat(stats, key))
  const present = values.filter((v): v is number => v !== null)
  if (present.length === 0) return null

  const lowerBetter = isLowerBetter(key)
  const target = lowerBetter ? Math.min(...present) : Math.max(...present)
  const worst = lowerBetter ? Math.max(...present) : Math.min(...present)

  // Pas de gagnant si toutes les valeurs presentes sont identiques.
  const bestIndex = target === worst ? null : values.findIndex((v) => v === target)

  const first = values[0]
  const percentFromFirst = values.map((v, i) => {
    if (i === 0 || v === null || first === null || first === 0) return null
    return ((v - first) / Math.abs(first)) * 100
  })

  return {
    key,
    label: labelFor(key, fallbackLabel),
    suffix: statSuffix(key),
    values,
    bestIndex: bestIndex === -1 ? null : bestIndex,
    percentFromFirst,
  }
}

export interface CompareGroupResult {
  label: string
  rows: StatDelta[]
}

export function buildComparison(
  columns: (CalculatedStats | null)[],
  fallbackLabel: (key: string) => string,
): CompareGroupResult[] {
  return COMPARE_GROUPS.map((group) => ({
    label: group.label,
    rows: group.keys
      .map((key) => buildDelta(key, columns, fallbackLabel))
      .filter((row): row is StatDelta => row !== null),
  })).filter((group) => group.rows.length > 0)
}
