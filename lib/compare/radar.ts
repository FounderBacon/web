import type { CalculatedStats } from "@/lib/types/calculate"
import { readStat } from "./stats"

// ── Axes du radar ────────────────────────────────────────────────
// Cinq axes lisibles d'un coup d'oeil. Chaque axe sait lire sa valeur
// depuis une arme ranged comme melee, sinon il est masque.

export interface RadarAxis {
  key: string
  label: string
  read: (stats: CalculatedStats) => number | null
  // Un axe "inverse" est meilleur quand la valeur brute est basse.
  inverted?: boolean
}

// Cadence : firingRate pour le ranged, attackSpeed pour le melee.
function readSpeed(stats: CalculatedStats): number | null {
  return readStat(stats, "firingRate") ?? readStat(stats, "attackSpeed")
}

// Portee : rangeMax pour le ranged, range pour le melee.
function readRange(stats: CalculatedStats): number | null {
  return readStat(stats, "rangeMax") ?? readStat(stats, "range")
}

// Precision : spread ADS si dispo, sinon hipfire. Absent en melee.
function readAccuracy(stats: CalculatedStats): number | null {
  return readStat(stats, "spreadADS") ?? readStat(stats, "spread")
}

export const RADAR_AXES: RadarAxis[] = [
  { key: "dps", label: "DPS", read: (s) => readStat(s, "avgDps") ?? readStat(s, "dps") },
  { key: "damage", label: "Damage", read: (s) => readStat(s, "damage") },
  { key: "speed", label: "Speed", read: readSpeed },
  { key: "accuracy", label: "Accuracy", read: readAccuracy, inverted: true },
  { key: "range", label: "Range", read: readRange },
  { key: "durability", label: "Durability", read: (s) => readStat(s, "durability") },
]

// ── Normalisation ────────────────────────────────────────────────

export interface RadarPoint {
  axis: string
  label: string
  // Valeur brute, pour le tooltip.
  raw: number | null
  // Valeur normalisee 0..1 relative aux armes comparees.
  ratio: number
}

export interface RadarSeries {
  points: RadarPoint[]
}

export interface RadarModel {
  axes: RadarAxis[]
  series: RadarSeries[]
}

const MIN_RATIO = 0.08

/**
 * Normalise chaque axe par rapport au maximum observe parmi les armes comparees.
 * Le radar montre donc un ecart relatif entre les armes affichees, pas une
 * position absolue dans le jeu : c'est ce qui rend les formes lisibles meme
 * quand deux armes ont des ordres de grandeur proches.
 */
export function buildRadarModel(columns: (CalculatedStats | null)[]): RadarModel {
  const active = columns.filter((s): s is CalculatedStats => s !== null)
  if (active.length === 0) return { axes: [], series: [] }

  // On ne garde que les axes lisibles par toutes les armes affichees,
  // sinon un fusil compare a une epee produirait un axe a zero trompeur.
  const axes = RADAR_AXES.filter((axis) => active.every((stats) => axis.read(stats) !== null))

  const bounds = axes.map((axis) => {
    const values = active.map((stats) => axis.read(stats)).filter((v): v is number => v !== null)
    return { min: Math.min(...values), max: Math.max(...values) }
  })

  const series = columns.map((stats) => {
    if (!stats) return { points: [] }
    const points = axes.map((axis, i) => {
      const raw = axis.read(stats)
      if (raw === null) return { axis: axis.key, label: axis.label, raw: null, ratio: 0 }

      const { min, max } = bounds[i]
      let ratio: number
      if (max === min) {
        ratio = 1
      } else if (axis.inverted) {
        // Sur un axe inverse, la plus petite valeur brute vaut le score plein.
        ratio = (max - raw) / (max - min)
      } else {
        ratio = (raw - min) / (max - min)
      }

      // Plancher visuel : une arme en retrait garde une surface visible.
      return { axis: axis.key, label: axis.label, raw, ratio: MIN_RATIO + ratio * (1 - MIN_RATIO) }
    })
    return { points }
  })

  return { axes, series }
}

// ── Geometrie ────────────────────────────────────────────────────

export interface Point2D {
  x: number
  y: number
}

/**
 * Position d'un point sur le radar. L'angle demarre en haut et tourne
 * dans le sens horaire.
 */
export function polarPoint(index: number, total: number, radius: number, center: number): Point2D {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  }
}

export function polygonPath(points: Point2D[]): string {
  if (points.length === 0) return ""
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z"
}
