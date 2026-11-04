"use client"

import type { CalculatedStats } from "@/lib/types/calculate"
import { buildRadarModel, polarPoint, polygonPath } from "@/lib/compare/radar"
import { formatStat } from "@/lib/format"

interface CompareRadarProps {
  columns: (CalculatedStats | null)[]
  names: (string | null)[]
  colors: string[]
}

const SIZE = 320
const CENTER = SIZE / 2
const RADIUS = 100
const RINGS = 4
// Marge horizontale du viewBox : les libelles d'axes sont poses au-dela du
// rayon et se faisaient couper sur les cotes ("Durability" -> "IRABILITY").
const PAD_X = 56

export function CompareRadar({ columns, names, colors }: CompareRadarProps) {
  const model = buildRadarModel(columns)
  const axisCount = model.axes.length

  // Sous 3 axes, un radar n'a plus de surface lisible.
  if (axisCount < 3) {
    return (
      <div className="flex min-h-72 items-center justify-center border border-border/50 p-6 text-center">
        <p className="max-w-64 text-sm text-muted-foreground">
          Not enough shared stats between these weapons to draw a radar.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox={`${-PAD_X} 0 ${SIZE + PAD_X * 2} ${SIZE}`}
        className="w-full max-w-96"
        role="img"
        aria-label="Weapon stats radar comparison"
      >
        {/* Grille concentrique */}
        {Array.from({ length: RINGS }, (_, ring) => {
          const r = (RADIUS * (ring + 1)) / RINGS
          const pts = model.axes.map((_, i) => polarPoint(i, axisCount, r, CENTER))
          return (
            <path
              key={ring}
              d={polygonPath(pts)}
              className="fill-none stroke-border/40"
              strokeWidth={1}
            />
          )
        })}

        {/* Rayons */}
        {model.axes.map((axis, i) => {
          const p = polarPoint(i, axisCount, RADIUS, CENTER)
          return (
            <line
              key={axis.key}
              x1={CENTER}
              y1={CENTER}
              x2={p.x}
              y2={p.y}
              className="stroke-border/40"
              strokeWidth={1}
            />
          )
        })}

        {/* Une surface par arme */}
        {model.series.map((serie, si) => {
          if (serie.points.length === 0) return null
          const pts = serie.points.map((point, i) => polarPoint(i, axisCount, RADIUS * point.ratio, CENTER))
          const color = colors[si] ?? colors[0]
          return (
            <g key={si}>
              <path d={polygonPath(pts)} fill={color} fillOpacity={0.16} stroke={color} strokeWidth={2} />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
              ))}
            </g>
          )
        })}

        {/* Libelles des axes */}
        {model.axes.map((axis, i) => {
          const p = polarPoint(i, axisCount, RADIUS + 16, CENTER)
          // L'ancrage suit la position horizontale pour eviter les debordements.
          const anchor = p.x > CENTER + 4 ? "start" : p.x < CENTER - 4 ? "end" : "middle"
          return (
            <text
              key={axis.key}
              x={p.x}
              y={p.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px] uppercase tracking-wider"
            >
              {axis.label}
            </text>
          )
        })}
      </svg>

      {/* Valeurs brutes par axe : une suite de nombres sans en-tete d'axe
          n'etait pas lisible, chaque valeur est donc rattachee a son axe. */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40">
              <th className="pb-1.5 pr-2 text-left font-normal text-muted-foreground">Axis</th>
              {model.series.map((serie, si) => {
                const name = names[si]
                if (!name || serie.points.length === 0) return null
                return (
                  <th key={si} className="pb-1.5 pl-2 text-right font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: colors[si] ?? colors[0] }}
                        aria-hidden
                      />
                      <span className="max-w-24 truncate text-foreground">{name}</span>
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {model.axes.map((axis, ai) => (
              <tr key={axis.key} className="border-b border-border/20 last:border-b-0">
                <td className="py-1 pr-2 uppercase tracking-wider text-muted-foreground">{axis.label}</td>
                {model.series.map((serie, si) => {
                  if (!names[si] || serie.points.length === 0) return null
                  return (
                    <td key={si} className="py-1 pl-2 text-right tabular-nums text-foreground/80">
                      {formatStat(serie.points[ai]?.raw ?? null)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
