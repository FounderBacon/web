import { fetchPopularGlobal, type PopularGlobalItem } from "@/lib/api/stats";
import type { TrackEntityType } from "@/lib/api/track";
import { RARITY_BG_DARK, RARITY_DECO } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";
import { TrendingCarousel, type CarouselItemProps } from "./TrendingCarousel";
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
  let failed = false;
  try {
    items = await fetchPopularGlobal("7d", 3);
  } catch {
    failed = true;
  }

  // Garder uniquement les items rattaches a une fiche reelle (avec name/slug)
  const top = items.filter((i) => i.name && i.slug).slice(0, 6);

  if (failed || top.length === 0) {
    return (
      <div className="flex max-w-lg flex-col gap-4">
        <p className="border border-king-700/50 bg-king-800/40 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur-sm">
          {failed ? "Trending data unavailable for now." : "No trending items yet — be the first to view some weapons!"}
        </p>
        <TrendingCTA href={ctaHref} label={ctaLabel} />
      </div>
    );
  }

  // Pre-calcul des props pour chaque item (reuse server-side + carousel client)
  const itemsProps: CarouselItemProps[] = top.map((item) => ({
    item,
    href: entityHref(locale, item.entityType, item.slug as string),
    colorClass: (item.rarity && RARITY_DECO[item.rarity]) ?? "text-primary",
    bgClass: (item.rarity && RARITY_BG_DARK[item.rarity]) ?? "bg-king-800/65 hover:bg-king-800",
    subtype: entitySubtype(item),
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile : carousel auto-scroll */}
      <div className="md:hidden">
        <TrendingCarousel items={itemsProps} />
      </div>

      {/* Tablette + desktop : liste verticale */}
      <ul className="hidden max-w-lg flex-col gap-4 md:flex">
        {itemsProps.map((p) => (
          <li key={`${p.item.entityType}-${p.item.entitySlug}`}>
            <TrendingWeeklyItem {...p} />
          </li>
        ))}
      </ul>

      <TrendingCTA href={ctaHref} label={ctaLabel} />
    </div>
  );
}
