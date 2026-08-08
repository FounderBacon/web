import { DecoFrame } from "@/components/svg/DecoFrame";
import { VentureTimer } from "@/components/public/VentureTimer";
import { parseVentureSeason, ventureEndDate, type VentureWeek } from "@/lib/api/ventures";

interface VentureDetailsProps {
  venture: VentureWeek;
  title?: string;
}

interface DetailRow {
  label: string;
  value: string;
  colorClass?: string;
}

// Couleur thematique selon l'element (lookup case-insensitive)
const ELEMENT_COLOR: Record<string, string> = {
  nature: "text-uncommon",
  energy: "text-rare",
  fire: "text-legendary",
  water: "text-rare",
  physical: "text-common",
};

export function VentureDetails({ venture, title = "Venture info" }: VentureDetailsProps) {
  const season = venture.venturesSeason;
  // Pas de saison : on peut quand meme avoir des echeances a afficher
  const parsed = season ? parseVentureSeason(season.raw) : null;

  const rows: DetailRow[] = [];
  if (parsed?.element) {
    const color = ELEMENT_COLOR[parsed.element.toLowerCase()] ?? "text-primary";
    rows.push({ label: "Element", value: parsed.element, colorClass: color });
  }
  if (parsed?.modifier) rows.push({ label: "Modifier", value: parsed.modifier });
  if (parsed?.type) rows.push({ label: "Season", value: parsed.type });
  if (venture.eventLlama) rows.push({ label: "Llama", value: venture.eventLlama });

  const questlineEnd = venture.questline?.leavesAt ?? null;
  const rotatesAt = ventureEndDate(venture);

  if (rows.length === 0 && !rotatesAt && !questlineEnd) return null;

  return (
    <div className="relative w-full bg-king-800/65 px-5 py-6 text-primary backdrop-blur-sm sm:px-6 sm:py-7 md:max-w-sm md:px-7 md:py-8">
      <DecoFrame variant="marked" className="pointer-events-none absolute" />
      <div className="relative">
        <h2 className="mb-4 font-burbank text-2xl uppercase leading-none text-primary-foreground md:mb-6 md:text-3xl">{title}</h2>
        <dl className="flex flex-col">
          {/* gap-3 + text-right : les valeurs longues (ex "Bouncy Husks")
              passent a la ligne au lieu de chevaucher le label en 375px */}
          {rows.map((row, i) => (
            <div key={row.label} className={`flex items-baseline justify-between gap-3 py-3 sm:gap-6 sm:py-4 ${i > 0 ? "border-t border-border/20" : ""}`}>
              <dt className="shrink-0 text-[11px] font-medium uppercase tracking-widest text-muted-foreground sm:text-xs">{row.label}</dt>
              <dd className={`text-balance text-right font-burbank text-lg uppercase leading-tight sm:text-xl md:text-2xl ${row.colorClass ?? "text-primary-foreground"}`}>{row.value}</dd>
            </div>
          ))}
        </dl>

        {(rotatesAt || questlineEnd) && (
          <div className="mt-2 flex flex-col border-t border-border/20">
            {rotatesAt && (
              <VentureTimer label="Rotates in" date={rotatesAt} showTarget />
            )}
            {questlineEnd && (
              <div className="border-t border-border/20">
                <VentureTimer label="Questline ends in" date={questlineEnd} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
