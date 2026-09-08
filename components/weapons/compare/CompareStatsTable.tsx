"use client"

import type { CalculatedStats } from "@/lib/types/calculate"
import { buildComparison, isLowerBetter, type StatDelta } from "@/lib/compare/stats"
import { formatStatName, STAT_DESC } from "@/lib/constants"
import { formatStat } from "@/lib/format"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

interface CompareStatsTableProps {
  columns: (CalculatedStats | null)[]
  names: (string | null)[]
}

// Un ecart sous ce seuil n'est pas signale : bruit d'arrondi cote API.
const NEGLIGIBLE_PERCENT = 0.5

function DeltaBadge({ row, index }: { row: StatDelta; index: number }) {
  const percent = row.percentFromFirst[index]
  if (percent === null || Math.abs(percent) < NEGLIGIBLE_PERCENT) return null

  // Un ecart negatif est un gain quand la stat est meilleure basse.
  const isGain = isLowerBetter(row.key) ? percent < 0 : percent > 0
  const sign = percent > 0 ? "+" : ""

  return (
    <span
      className={`ml-1.5 text-[11px] tabular-nums ${
        isGain ? "text-uncommon-dark dark:text-uncommon" : "text-malus-dark dark:text-malus"
      }`}
    >
      {sign}
      {percent.toFixed(1)}%
    </span>
  )
}

function StatRow({ row, columnCount }: { row: StatDelta; columnCount: number }) {
  const desc = STAT_DESC[row.key]

  return (
    <div
      className="grid items-center gap-2 border-b border-border/30 px-4 py-2 last:border-b-0"
      style={{ gridTemplateColumns: `minmax(0,1.2fr) repeat(${columnCount}, minmax(0,1fr))` }}
    >
      {desc ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help truncate text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
              {row.label}
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-64 bg-popover text-popover-foreground">
            <p className="text-xs">{desc}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="truncate text-xs text-muted-foreground">{row.label}</span>
      )}

      {row.values.map((value, i) => {
        const isBest = row.bestIndex === i
        return (
          <div key={i} className="flex items-baseline justify-end">
            <span
              className={`tabular-nums text-sm ${
                isBest ? "font-semibold text-foreground" : "text-foreground/70"
              }`}
            >
              {value === null ? "—" : `${formatStat(value)}${row.suffix}`}
            </span>
            {i > 0 && <DeltaBadge row={row} index={i} />}
          </div>
        )
      })}
    </div>
  )
}

export function CompareStatsTable({ columns, names }: CompareStatsTableProps) {
  const groups = buildComparison(columns, formatStatName)
  const columnCount = columns.length

  if (groups.length === 0) {
    return (
      <div className="border border-border/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">Select at least one weapon to see stats.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden border border-border/50">
      {/* En-tete colle : rappelle quelle colonne est quelle arme */}
      <div
        className="grid items-center gap-2 border-b border-border/50 bg-card px-4 py-2"
        style={{ gridTemplateColumns: `minmax(0,1.2fr) repeat(${columnCount}, minmax(0,1fr))` }}
      >
        <p className="font-burbank text-sm uppercase tracking-wider text-foreground">Stats</p>
        {names.map((name, i) => (
          <p key={i} className="truncate text-right text-xs font-medium text-muted-foreground">
            {name ?? "—"}
          </p>
        ))}
      </div>

      <Accordion type="multiple" defaultValue={groups.map((g) => g.label)}>
        {groups.map((group) => (
          <AccordionItem key={group.label} value={group.label} className="border-b border-border/50 last:border-b-0">
            <AccordionTrigger className="px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground hover:no-underline">
              {group.label}
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              {group.rows.map((row) => (
                <StatRow key={row.key} row={row} columnCount={columnCount} />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
