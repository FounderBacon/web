"use client"

import type { CalculatedStats } from "@/lib/types/calculate"
import { barRatios, buildComparison, isLowerBetter, COMPARE_STAT_DESC, type StatDelta } from "@/lib/compare/stats"
import { buildVerdict, type ColumnVerdict } from "@/lib/compare/verdict"
import { CMP_ROW, CMP_VALUES } from "@/lib/compare/grid"
import { formatStatName, STAT_DESC } from "@/lib/constants"
import { formatStat } from "@/lib/format"
import { fmt, useCompareT } from "@/lib/compare/i18n"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

interface CompareStatsTableProps {
  columns: (CalculatedStats | null)[]
  names: (string | null)[]
  // Meme palette que l'en-tete de colonnes et le radar : c'est elle qui
  // rattache une valeur a son arme une fois l'en-tete hors du champ de vision,
  // et la seule cle disponible sous md ou les libelles de colonne ne tiennent pas.
  colors?: string[]
  // Faux quand le tableau est deja le contenu d'un cadre — la modal — ou un
  // encadrement de plus ferait une boite dans une boite.
  bordered?: boolean
}

// Un ecart sous ce seuil n'est pas signale : bruit d'arrondi cote API.
const NEGLIGIBLE_PERCENT = 0.5

// Fond de la cellule gagnante, dans la couleur de sa colonne. Le gras seul ne
// se remarquait pas en parcourant la liste ; un aplat, si.
function winnerTint(color: string | undefined): string | undefined {
  return /^#[0-9a-f]{6}$/i.test(color ?? "") ? `${color}14` : undefined
}

function DeltaBadge({ row, index }: { row: StatDelta; index: number }) {
  const percent = row.percentFromFirst[index]
  if (percent === null || Math.abs(percent) < NEGLIGIBLE_PERCENT) return null

  // Un ecart negatif est un gain quand la stat est meilleure basse.
  const isGain = isLowerBetter(row.key) ? percent < 0 : percent > 0
  const sign = percent > 0 ? "+" : ""

  return (
    <span
      className={`shrink-0 text-[9px] tabular-nums md:text-[10px] ${
        isGain ? "text-uncommon-dark dark:text-uncommon" : "text-malus-dark dark:text-malus"
      }`}
    >
      {sign}
      {percent.toFixed(1)}%
    </span>
  )
}

/**
 * Une cellule de valeur : le nombre, son ecart a la premiere colonne, et une
 * barre dont la longueur situe l'arme face aux autres sur cette ligne.
 *
 * La barre est ce qui rend une ligne lisible d'un coup d'oeil : avant, deux
 * nombres alignes obligeaient a les lire et les diviser mentalement pour
 * savoir lequel gagnait, et le gagnant n'etait marque que par une graisse.
 */
function ValueCell({
  row,
  index,
  ratio,
  color,
  tight,
}: {
  row: StatDelta
  index: number
  ratio: number | null
  color?: string
  // Vrai a partir de 4 colonnes : sous md elles tombent a ~97px, ou une valeur
  // a quatre chiffres et son ecart en pourcent ne tiennent plus cote a cote.
  tight: boolean
}) {
  const value = row.values[index]
  // Egalite en tete : toutes les colonnes qui portent la meilleure valeur sont
  // marquees, pas seulement la premiere trouvee — sinon deux armes a 75% de
  // multiplicateur critique s'affichent comme si l'une battait l'autre.
  const best = row.bestIndex === null ? null : row.values[row.bestIndex]
  const isBest = best !== null && value === best

  return (
    <div
      className="flex min-w-0 flex-col gap-1 border-l border-border/30 px-2 py-1 md:px-3"
      style={{ backgroundColor: isBest ? winnerTint(color) : undefined }}
    >
      <div
        className={`flex gap-1.5 md:flex-row md:items-baseline md:justify-end ${
          tight ? "flex-col items-start" : "items-baseline justify-between"
        }`}
      >
        {/* Corps un cran plus petit sous md : a trois colonnes sur un
            telephone, une valeur a quatre chiffres et son ecart en pourcent
            partagent ~110px et la valeur se faisait tronquer. */}
        <span
          className={`truncate text-[13px] tabular-nums md:text-sm ${
            isBest ? "font-semibold text-foreground" : "text-foreground/60"
          }`}
        >
          {value === null ? "—" : `${formatStat(value)}${row.suffix}`}
        </span>
        {index > 0 && <DeltaBadge row={row} index={index} />}
      </div>

      {ratio !== null && (
        <div className="h-1 w-full bg-border/30" aria-hidden>
          <div
            className="h-full transition-[width] duration-300"
            style={{
              width: `${Math.round(ratio * 100)}%`,
              backgroundColor: color,
              // Seule la meilleure valeur de la ligne est pleinement saturee :
              // la hierarchie reste lisible meme entre deux barres de longueur
              // proche.
              opacity: isBest ? 1 : 0.45,
            }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Bandeau de verdict : qui domine, et sur quelles categories.
 *
 * Pose sur la meme grille que les lignes de stats, donc chaque score tombe
 * dans la colonne de son arme, comme le reste du tableau.
 */
function VerdictRow({
  verdict,
  names,
  colors,
  decidedGroups,
  tight,
}: {
  verdict: ColumnVerdict[]
  names: (string | null)[]
  colors?: string[]
  decidedGroups: number
  tight: boolean
}) {
  const t = useCompareT()
  return (
    <div className={`border-b border-border/50 bg-muted/25 px-3 py-3 md:gap-2 md:px-4 ${CMP_ROW}`}>
      <div className="mb-2 md:mb-0 md:self-center">
        <p className="font-burbank text-sm uppercase tracking-wider text-foreground">{t.verdict}</p>
        <p className="text-[10px] leading-snug text-muted-foreground">
          {t.verdictHint}
        </p>
      </div>

      <div className={CMP_VALUES}>
        {verdict.map((column, i) => (
          <div key={i} className="flex min-w-0 flex-col gap-1 border-l border-border/30 px-2 md:px-3">
            <div
        className={`flex gap-1.5 md:flex-row md:items-baseline md:justify-end ${
          tight ? "flex-col items-start" : "items-baseline justify-between"
        }`}
      >
              <span className="text-lg font-bold leading-none tabular-nums text-foreground md:text-2xl">
                {column.score ?? "—"}
              </span>
            </div>

            {column.score !== null && (
              <div className="h-1.5 w-full bg-border/30" aria-hidden>
                <div
                  className="h-full transition-[width] duration-300"
                  style={{ width: `${column.score}%`, backgroundColor: colors?.[i] }}
                />
              </div>
            )}

            {/* Le score seul ne dit pas pourquoi : les categories dominees le
                disent, et c'est souvent ca qui decide entre deux armes
                proches. */}
            <p className="text-[10px] leading-snug text-muted-foreground">
              {column.leads.length > 0 ? (
                <>
                  <span className="text-foreground">
                    {fmt(t.leads, { count: column.leads.length, total: decidedGroups })}
                  </span>
                  {/* A quatre colonnes, la liste des categories ne tient pas
                      dans une colonne de telephone : elle revient des sm. */}
                  <span className={tight ? "hidden sm:inline" : ""}>
                    {" — "}
                    {column.leads.join(", ")}
                  </span>
                </>
              ) : (
                fmt(t.leadsNone, { total: decidedGroups })
              )}
              <span className="sr-only">{fmt(t.forColumn, { name: names[i] ?? fmt(t.columnN, { n: i + 1 }) })}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatRow({ row, colors, tight }: { row: StatDelta; colors?: string[]; tight: boolean }) {
  // Les descriptions du comparateur passent devant : elles precisent
  // l'hypothese de crit, que la description globale ne mentionne pas.
  const desc = COMPARE_STAT_DESC[row.key] ?? STAT_DESC[row.key]
  const ratios = barRatios(row)

  return (
    <div
      className={`border-b border-border/30 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-muted/20 md:items-center md:gap-2 md:px-4 ${CMP_ROW}`}
    >
      {/* Sous md le libelle occupe sa propre ligne : c'est ce qui permet aux
          valeurs de tenir en pleine largeur sans scroll horizontal. */}
      <div className="mb-1.5 md:mb-0">
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
      </div>

      <div className={CMP_VALUES}>
        {row.values.map((_, i) => (
          <ValueCell key={i} row={row} index={i} ratio={ratios[i]} color={colors?.[i]} tight={tight} />
        ))}
      </div>
    </div>
  )
}

/**
 * Tableau de stats du comparateur.
 *
 * Il n'a pas d'en-tete a lui : l'identite des colonnes est portee par
 * `CompareColumnsHeader`, colle en haut et aligne sur la meme grille. En
 * afficher un second ici dupliquait la meme information et, une fois colle
 * dans un conteneur scrollable, se chevauchait avec le premier.
 */
export function CompareStatsTable({ columns, names, colors, bordered = true }: CompareStatsTableProps) {
  const t = useCompareT()
  const groups = buildComparison(columns, formatStatName)
  const verdict = buildVerdict(groups, columns.length)
  const tight = columns.length >= 4

  if (groups.length === 0) {
    return (
      <div className={`p-6 text-center ${bordered ? "border border-border/50" : ""}`}>
        <p className="text-sm text-muted-foreground">{t.selectToSeeStats}</p>
      </div>
    )
  }

  return (
    <div className={bordered ? "border border-border/50" : ""}>
      {/* Les noms restent accessibles aux lecteurs d'ecran : visuellement ils
          sont portes par l'en-tete de colonnes, pas repetes sur chaque ligne. */}
      <p className="sr-only">{fmt(t.comparing, { names: names.filter(Boolean).join(", ") })}</p>

      {verdict.decidedGroups > 0 && (
        <VerdictRow
          verdict={verdict.columns}
          names={names}
          colors={colors}
          decidedGroups={verdict.decidedGroups}
          tight={tight}
        />
      )}

      {/* La cle suit la liste des groupes : "Hero bonus" apparait quand une colonne
          recoit un loadout, et un accordeon non controle n'ouvre que les groupes
          connus a son montage — le nouveau groupe restait replie. */}
      <Accordion key={groups.map((g) => g.label).join("|")} type="multiple" defaultValue={groups.map((g) => g.label)}>
        {groups.map((group) => (
          <AccordionItem key={group.label} value={group.label} className="border-b border-border/50 last:border-b-0">
            {/* Le leader sur l'en-tete du groupe : en scrollant, l'en-tete de
                colonnes reste en haut mais ne dit pas qui domine la section
                qu'on est en train de lire. */}
            <AccordionTrigger className="bg-muted/20 px-3 py-2 font-burbank text-xs uppercase tracking-wider text-muted-foreground hover:no-underline md:px-4">
              <span className="flex w-full min-w-0 items-center justify-between gap-2 pr-2">
                <span className="shrink-0">{group.label}</span>
                {(() => {
                  const leader = verdict.leaderByGroup[group.label]
                  const name = leader === null || leader === undefined ? null : names[leader]
                  if (leader === null || leader === undefined || !name) return null
                  return (
                    <span className="flex min-w-0 items-center gap-1.5 font-sans text-[10px] normal-case tracking-normal text-muted-foreground">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: colors?.[leader] }}
                        aria-hidden
                      />
                      <span className="truncate">{name}</span>
                    </span>
                  )
                })()}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              {group.rows.map((row) => (
                <StatRow key={row.key} row={row} colors={colors} tight={tight} />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
