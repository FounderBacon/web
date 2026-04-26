import { DecoFrame } from "@/components/svg/DecoFrame";
import { parseVentureSeason, type VentureWeek } from "@/lib/api/ventures";

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
  if (!season) return null;

  const parsed = parseVentureSeason(season.raw);

  const rows: DetailRow[] = [];
  if (parsed.element) {
    const color = ELEMENT_COLOR[parsed.element.toLowerCase()] ?? "text-primary";
    rows.push({ label: "Element", value: parsed.element, colorClass: color });
  }
  if (parsed.modifier) rows.push({ label: "Modifier", value: parsed.modifier });
  if (parsed.type) rows.push({ label: "Season", value: parsed.type });
  if (venture.eventLlama) rows.push({ label: "Llama", value: venture.eventLlama });

  if (rows.length === 0) return null;

  return (
    <div className="relative w-full max-w-sm bg-king-800/65 px-6 py-7 text-primary backdrop-blur-sm md:px-7 md:py-8">
      <DecoFrame variant="marked" className="pointer-events-none absolute" />
      <div className="relative">
        <h2 className="mb-6 font-burbank text-2xl uppercase leading-none text-primary-foreground md:text-3xl">{title}</h2>
        <dl className="flex flex-col">
          {rows.map((row, i) => (
            <div key={row.label} className={`flex items-baseline justify-between gap-6 py-4 ${i > 0 ? "border-t border-border/20" : ""}`}>
              <dt className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{row.label}</dt>
              <dd className={`font-burbank text-xl uppercase leading-none md:text-2xl ${row.colorClass ?? "text-primary-foreground"}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
