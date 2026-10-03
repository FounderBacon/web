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
    // La famille des DPS est rangee du plus realiste au plus theorique, et
    // "avec crit" passe devant "brut" : c'est la valeur qui decrit ce que
    // l'arme fait vraiment, et la seule qui bouge quand on change un perk de
    // crit. La voir en second, derriere un "DPS" immobile, donnait
    // l'impression que le comparateur ignorait le crit.
    label: "Damage",
    keys: ["damage", "avgDps", "dps", "critDps", "headshotDps", "critHeadshot", "headshotDamage"],
  },
  {
    label: "Crit",
    keys: ["critChance", "critDamageMultiplier", "critGain", "headshotMultiplier"],
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
//
// Les quatre DPS renvoyes par l'API mesurent la meme chose sous quatre
// hypotheses de crit differentes. Nommes "DPS", "Crit DPS", "Avg DPS" et
// "HS DPS", rien ne disait lesquels integraient le crit : on lisait "DPS"
// comme la valeur de reference, et elle ne bougeait pas d'un perk de crit.
// Le suffixe entre parentheses rattache les quatre lignes a une meme famille
// et rend l'hypothese lisible sans ouvrir d'infobulle.
export const COMPARE_STAT_LABELS: Record<string, string> = {
  critDps: "DPS (all crits)",
  avgDps: "DPS (with crit)",
  headshotDps: "DPS (headshots)",
  headshotDamage: "Headshot Damage",
  critHeadshot: "Crit Headshot",
  critDamageMultiplier: "Crit Multiplier",
  dps: "DPS (no crit)",
  critGain: "Crit Gain",
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

/**
 * Descriptions propres au comparateur, prioritaires sur STAT_DESC.
 *
 * Elles disent l'hypothese de crit de chaque mesure. Sans elles, la moitie
 * des lignes de la famille DPS n'avait aucune infobulle, et "DPS" heritait
 * d'un "Damage per second" qui ne mentionnait pas qu'il excluait le crit.
 */
export const COMPARE_STAT_DESC: Record<string, string> = {
  critGain: "Average damage the critical hits actually add, crit chance applied to crit multiplier. A high chance on a weak multiplier is worth no more than a huge multiplier that never triggers.",
  dps: "Sustained damage per second, without any critical hit. A crit perk does not change this number.",
  avgDps: "Damage per second averaged over time, weighted by crit chance and crit multiplier. The closest to real play.",
  critDps: "Damage per second if every hit were a critical hit. An upper bound, not a realistic figure.",
  headshotDps: "Damage per second if every hit were a headshot.",
  critHeadshot: "Damage of a single hit that is both a critical hit and a headshot.",
  headshotDamage: "Damage of a single headshot, without critical hit.",
  critDamageMultiplier: "Damage multiplier applied on a critical hit.",
  impactDamage: "Stagger damage per hit, unaffected by crit.",
}

// Stats exprimees en pourcentage cote API.
const PERCENT_STATS = new Set(["critChance", "critDamageMultiplier", "headshotMultiplier", "critGain"])

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

function rawStat(stats: CalculatedStats, key: string): number | null {
  const value = (stats as unknown as Record<string, unknown>)[key]
  return typeof value === "number" && !Number.isNaN(value) ? value : null
}

/**
 * Stats calculees a partir de la reponse de l'API plutot que lues telles quelles.
 *
 * Le crit ne se mesure ni par sa chance ni par son multiplicateur pris
 * isolement : c'est leur produit qui dit ce qu'il rapporte. Sans cette ligne,
 * un build qui gagne la chance et un build qui gagne le multiplicateur
 * ressortaient a egalite dans le verdict, alors que l'un apporte nettement
 * plus de degats que l'autre.
 */
const DERIVED_STATS: Record<string, (stats: CalculatedStats) => number | null> = {
  critGain: (stats) => {
    const chance = rawStat(stats, "critChance")
    const multiplier = rawStat(stats, "critDamageMultiplier")
    if (chance === null || multiplier === null) return null
    return (chance / 100) * multiplier
  },
}

export function readStat(stats: CalculatedStats | null, key: string): number | null {
  if (!stats) return null
  const derived = DERIVED_STATS[key]
  return derived ? derived(stats) : rawStat(stats, key)
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

// ── Magnitude ────────────────────────────────────────────────────

// Plancher visuel : une arme nettement en retrait garde une barre visible,
// sinon la cellule parait vide plutot que faible.
const MIN_BAR = 0.12

/**
 * Position de chaque colonne sur la ligne, 0 (la plus faible) a 1 (la
 * meilleure), sans plancher visuel.
 *
 * L'echelle est locale a la ligne : elle compare les armes affichees entre
 * elles, pas a l'ensemble du jeu. Deux stats voisines n'ont ni la meme unite
 * ni le meme ordre de grandeur (un DPS a 4 chiffres, un multiplicateur a 1),
 * donc une echelle commune a tout le tableau ne voudrait rien dire.
 *
 * Sur une stat meilleure basse, l'echelle est inversee : c'est la plus petite
 * valeur qui obtient 1, pour que "plus haut = meilleur" reste vrai partout
 * sans avoir a lire le nom de la stat.
 *
 * C'est la mesure brute dont derivent la longueur des barres et le score du
 * verdict ; elle est donc rendue sans le plancher d'affichage, qui fausserait
 * une moyenne.
 */
export function normalizedPositions(row: StatDelta): (number | null)[] {
  const present = row.values.filter((v): v is number => v !== null)
  // Une seule arme porte la stat : il n'y a rien a situer, et la compter
  // comme une victoire gonflerait son score sans qu'aucune comparaison
  // n'ait eu lieu.
  if (present.length < 2) return row.values.map(() => null)

  const max = Math.max(...present)
  const min = Math.min(...present)
  const lowerBetter = isLowerBetter(row.key)

  return row.values.map((v) => {
    if (v === null) return null
    // Toutes identiques : position pleine pour tout le monde plutot qu'une
    // division par zero.
    if (max === min) return 1
    return lowerBetter ? (max - v) / (max - min) : (v - min) / (max - min)
  })
}

/** Longueur de la barre de magnitude, avec son plancher visuel. */
export function barRatios(row: StatDelta): (number | null)[] {
  return normalizedPositions(row).map((r) => (r === null ? null : MIN_BAR + r * (1 - MIN_BAR)))
}
