import { VentureCountdownBlocks } from "@/components/public/VentureCountdownBlocks";
import { parseVentureSeason, ventureEndDate, type VentureWeek } from "@/lib/api/ventures";

interface VentureDetailsProps {
  venture: VentureWeek;
  title?: string;
  countdownLabels: {
    rotatesIn: string;
    rotatingNow: string;
    questlineEndsIn: string;
    units: { days: string; hours: string; minutes: string; seconds: string };
  };
}

interface DetailRow {
  label: string;
  value: string;
}

// Pastille de couleur par element (lookup case-insensitive).
const ELEMENT_DOT: Record<string, string> = {
  nature: "bg-uncommon",
  energy: "bg-rare",
  fire: "bg-legendary",
  water: "bg-rare",
  physical: "bg-common",
};

/**
 * Panneau venture du heros desktop.
 *
 * Meme langage que le heros mobile : panneau carre, elements en
 * pastilles, compte a rebours en blocs. L'ancien cadre penche (DecoFrame)
 * empilait cinq lignes de meme poids, ou le compte a rebours — l'information
 * qui change — se perdait parmi les libelles fixes.
 */
export function VentureDetails({ venture, title = "Venture info", countdownLabels }: VentureDetailsProps) {
  const season = venture.venturesSeason;
  // Pas de saison : on peut quand meme avoir des echeances a afficher
  const parsed = season ? parseVentureSeason(season.raw) : null;

  // "Nature, Fire, Water" : un element par pastille.
  const elements = (parsed?.element ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const rows: DetailRow[] = [];
  if (parsed?.modifier) rows.push({ label: "Modifier", value: parsed.modifier });
  if (parsed?.type) rows.push({ label: "Season", value: parsed.type });
  if (venture.eventLlama) rows.push({ label: "Llama", value: venture.eventLlama });

  const questlineEnd = venture.questline?.leavesAt ?? null;
  const rotatesAt = ventureEndDate(venture);

  if (elements.length === 0 && rows.length === 0 && !rotatesAt && !questlineEnd) return null;

  return (
    <div className="w-full border border-foreground/10 bg-king-800 shadow-2xl md:max-w-sm">
      <div className="h-1 bg-primary" aria-hidden />
      <div className="flex flex-col gap-6 p-6 lg:p-7">
        <div className="flex flex-col gap-3">
          <h2 className="font-burbank text-2xl uppercase leading-none text-primary-foreground lg:text-3xl">{title}</h2>
          {elements.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Element">
              {elements.map((el) => (
                <li
                  key={el}
                  className="flex h-7 items-center gap-1.5 border border-foreground/15 px-2.5 text-xs font-medium capitalize text-primary-foreground"
                >
                  <span className={`size-2 rounded-full ${ELEMENT_DOT[el.toLowerCase()] ?? "bg-primary"}`} aria-hidden />
                  {el}
                </li>
              ))}
            </ul>
          )}
        </div>

        {rows.length > 0 && (
          <dl className="flex flex-col">
            {rows.map((row, i) => (
              <div key={row.label} className={`flex items-baseline justify-between gap-4 py-2.5 ${i > 0 ? "border-t border-foreground/10" : ""}`}>
                <dt className="shrink-0 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{row.label}</dt>
                <dd className="text-balance text-right font-burbank text-xl uppercase leading-tight text-primary-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {(rotatesAt || questlineEnd) && (
          <VentureCountdownBlocks rotatesAt={rotatesAt?.toISOString() ?? null} questlineEndsAt={questlineEnd} labels={countdownLabels} tone="panel" />
        )}
      </div>
    </div>
  );
}
