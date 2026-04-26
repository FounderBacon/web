// ── Raretes ─────────────────────────────────────────────────────
export const RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "mythic"] as const

export const RARITY_BG: Record<string, string> = {
  common: "bg-common",
  uncommon: "bg-uncommon",
  rare: "bg-rare",
  epic: "bg-epic",
  legendary: "bg-legendary",
  mythic: "bg-mythic",
}

export const RARITY_TEXT: Record<string, string> = {
  common: "text-common-dark dark:text-common",
  uncommon: "text-uncommon-dark dark:text-uncommon",
  rare: "text-rare-dark dark:text-rare",
  epic: "text-epic-dark dark:text-epic",
  legendary: "text-legendary-dark dark:text-legendary",
  mythic: "text-mythic-dark dark:text-mythic",
}

// Couleur vibrante (sans variante -dark) pour les decorations sur fond sombre
export const RARITY_DECO: Record<string, string> = {
  common: "text-common",
  uncommon: "text-uncommon",
  rare: "text-rare",
  epic: "text-epic",
  legendary: "text-legendary",
  mythic: "text-mythic",
}

// Fond sombre teinte par rarete (avec hover) — utilise la variante -dark a 65%
export const RARITY_BG_DARK: Record<string, string> = {
  common: "bg-common-dark/65 hover:bg-common-dark",
  uncommon: "bg-uncommon-dark/65 hover:bg-uncommon-dark",
  rare: "bg-rare-dark/65 hover:bg-rare-dark",
  epic: "bg-epic-dark/65 hover:bg-epic-dark",
  legendary: "bg-legendary-dark/65 hover:bg-legendary-dark",
  mythic: "bg-mythic-dark/65 hover:bg-mythic-dark",
}

// ── Categories ──────────────────────────────────────────────────
export const RANGED_CATEGORIES = ["assault", "launcher", "pistol", "shotgun", "smg", "sniper"] as const
export const MELEE_CATEGORIES = ["sword", "hardware", "spear", "scythe", "axe", "club"] as const

// ── Traps ───────────────────────────────────────────────────────
export const TRAP_PLACEMENTS = ["floor", "wall", "ceiling"] as const
export const TRAP_TARGETS = ["hostile", "friendly"] as const

// ── Elements ────────────────────────────────────────────────────
export const ELEMENTS = ["physical", "energy", "fire", "water", "nature"] as const

// ── Stats ───────────────────────────────────────────────────────
export const MAIN_STATS = ["damage", "dps", "critChance", "critMultiplier", "firingRate", "clipSize", "reloadTime", "durability", "totalShots", "totalHits", "attackSpeed"] as const

export const STAT_MAX: Record<string, number> = {
  damage: 200, dps: 500, impactDamage: 200, envDamage: 100,
  critChance: 1, critMultiplier: 5, headshotMultiplier: 3, vulnerabilityMultiplier: 3,
  firingRate: 15, clipSize: 100, reloadTime: 5,
  durability: 600, totalShots: 5000, attackSpeed: 5, totalHits: 5000,
}

export const STAT_LABELS: Record<string, string> = {
  damage: "Damage",
  dps: "DPS",
  clipSize: "Magazine",
  reloadTime: "Reload",
  firingRate: "Fire Rate",
  critChance: "Crit Chance",
  critMultiplier: "Crit Multiplier",
  headshotMultiplier: "Headshot Mult",
  impactDamage: "Impact",
  envDamage: "Env Damage",
  durability: "Durability",
  durabilityPerUse: "Durability/Use",
  totalShots: "Total Shots",
  totalHits: "Total Hits",
  attackSpeed: "Attack Speed",
  maxSpareAmmo: "Max Ammo",
  ammoCost: "Ammo Cost",
  vulnerabilityMultiplier: "Vulnerability Mult",
}

export const STAT_DESC: Record<string, string> = {
  damage: "Base damage per hit",
  dps: "Damage per second",
  impactDamage: "Stagger damage per hit",
  envDamage: "Damage to structures and environment",
  critChance: "Chance to land a critical hit",
  critMultiplier: "Damage multiplier on critical hit",
  headshotMultiplier: "Damage multiplier on headshot",
  vulnerabilityMultiplier: "Bonus damage to vulnerable targets",
  firingRate: "Rounds fired per second",
  clipSize: "Ammo in magazine before reload",
  reloadTime: "Time to reload in seconds",
  durability: "Total weapon durability",
  durabilityPerUse: "Durability consumed per shot/hit",
  totalShots: "Total shots before weapon breaks",
  totalHits: "Total hits before weapon breaks",
  attackSpeed: "Melee attacks per second",
  spread: "Hipfire spread angle",
  spreadADS: "ADS spread angle",
  recoilVertical: "Vertical recoil per shot",
  recoilHorizontal: "Horizontal recoil per shot",
}

export const STAT_GROUPS: Record<string, string[]> = {
  "Combat": ["impactDamage", "envDamage", "headshotMultiplier", "vulnerabilityMultiplier", "knockback", "stunTime", "stunScale"],
  "Accuracy": ["spread", "spreadADS", "standingStillSpreadMult", "recoilVertical", "recoilHorizontal", "recoilADSMultiplier"],
  "Range": ["rangePB", "rangeMid", "rangeLong", "rangeMax", "isHitscan"],
  "Ammo": ["maxSpareAmmo", "ammoCost", "pellets", "burstFiringRate", "damageMid", "damageLong"],
  "Durability": ["durability", "durabilityPerUse", "totalShots", "totalHits"],
  "Melee": ["attackSpeed", "swingTime", "swingPlaySpeed", "range", "coneAngle", "conePitch", "buildingRange2D", "buildingRangeZ", "weakSpotRange"],
  "Other": ["fireMode", "reloadType", "projectileVelocity", "overheatMaxValue", "overheatHeatingValue", "overheatCoolingValue", "minChargeTime", "maxChargeTime"],
}

export const DPS_DESC: Record<string, string> = {
  "DPS": "Damage per second without critical hits",
  "Crit DPS": "Damage per second if every hit crits",
  "Avg DPS": "Average DPS accounting for crit chance",
  "HS DPS": "Average DPS with headshot multiplier",
  "Hit": "Base damage per single hit",
  "Crit Hit": "Damage of a single critical hit",
  "Crit %": "Chance to land a critical hit",
  "Crit x": "Damage multiplier on critical hit",
}

// ── Bonus mapping ───────────────────────────────────────────────
export const BONUS_TO_STAT: Record<string, string> = {
  reloadSpeed: "reloadTime",
}

export function bonusColor(delta: number): string {
  if (delta === 0) return "text-common-dark"
  return delta > 0 ? "text-uncommon-dark dark:text-uncommon" : "text-malus-dark dark:text-malus"
}

export function formatStatName(key: string): string {
  return STAT_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
}
