import { fetchPopularGlobal, type PopularGlobalItem } from "@/lib/api/stats";
import type { TrackEntityType } from "@/lib/api/track";
import { RARITY_BG_DARK, RARITY_DECO } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";
import { TrendingCTA } from "./TrendingCTA";
import { TrendingWeeklyItem } from "./TrendingWeeklyItem";

const TYPE_LABEL: Record<TrackEntityType, string> = {
  "weapon-ranged": "Ranged",
  "weapon-melee": "Melee",
  trap: "Trap",
  hero: "Hero",
  survivor: "Survivor",
  "survivor-lead": "Survivor Lead",
};

function entityHref(locale: Locale, entityType: TrackEntityType, slug: string): string | null {
  if (entityType === "weapon-ranged") return `/${locale}/weapons/ranged/${slug}`;
  if (entityType === "weapon-melee") return `/${locale}/weapons/melee/${slug}`;
  if (entityType === "trap") return `/${locale}/traps/${slug}`;
  return null;
}

// Sous-categorie a afficher (assault, sniper, sword, floor...)
function entitySubtype(item: PopularGlobalItem): string {
  switch (item.entityType) {
    case "weapon-ranged":
    case "weapon-melee":
      return item.category ?? TYPE_LABEL[item.entityType];
    case "trap":
      return item.placement ?? TYPE_LABEL[item.entityType];
    case "hero":
      return item.heroClass ?? TYPE_LABEL[item.entityType];
    case "survivor-lead":
      return item.squadType ?? TYPE_LABEL[item.entityType];
    default:
      return TYPE_LABEL[item.entityType];
  }
}

interface TrendingWeeklyProps {
  locale: Locale
  ctaLabel: string
  ctaHref: string
}

export async function TrendingWeekly({ locale, ctaLabel, ctaHref }: TrendingWeeklyProps) {
  let items: PopularGlobalItem[] = [];
  try {
    items = await fetchPopularGlobal("7d", 3);
  } catch {
    return null;
  }

  // Garder uniquement les items rattaches a une fiche reelle (avec name/slug)
  const top = items.filter((i) => i.name && i.slug).slice(0, 6);

  if (top.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex max-w-lg flex-col gap-4">
        {top.map((item) => {
          const slug = item.slug as string;
          const href = entityHref(locale, item.entityType, slug);
          const colorClass = (item.rarity && RARITY_DECO[item.rarity]) ?? "text-primary";
          const bgClass = (item.rarity && RARITY_BG_DARK[item.rarity]) ?? "bg-king-800/65 hover:bg-king-800";
          const key = `${item.entityType}-${item.entitySlug}`;
          return (
            <li key={key}>
              <TrendingWeeklyItem item={item} href={href} bgClass={bgClass} colorClass={colorClass} subtype={entitySubtype(item)} />
            </li>
          );
        })}
      </ul>
      <TrendingCTA href={ctaHref} label={ctaLabel} />
    </div>
  );
}
