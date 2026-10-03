import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { fetchPopularGlobal, type PopularGlobalItem } from "@/lib/api/stats";
import type { TrackEntityType } from "@/lib/api/track";
import { entityIcon } from "@/lib/cdn";
import { RARITY_BG_DARK, RARITY_DECO, RARITY_GRADIENT } from "@/lib/constants";
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
  if (entityType === "hero") return `/${locale}/heroes/${slug}`;
  if (entityType === "survivor") return `/${locale}/survivors/${slug}`;
  if (entityType === "survivor-lead") return `/${locale}/survivor-leads/${slug}`;
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

// Liseré bas des cartes mobiles, dans la couleur de rarete. Classes ecrites en
// entier : Tailwind ne detecte pas un nom de classe assemble a l'execution.
const RARITY_BORDER_B: Record<string, string> = {
  common: "border-b-common",
  uncommon: "border-b-uncommon",
  rare: "border-b-rare",
  epic: "border-b-epic",
  legendary: "border-b-legendary",
  mythic: "border-b-mythic",
};

// La home rend ce composant deux fois (heros desktop, section mobile) : sans
// cache, chaque rendu de page lancerait deux fois le meme appel API.
const getTrending = cache(() => fetchPopularGlobal("7d", 3));

export interface TrendingItemProps {
  item: PopularGlobalItem
  href: string | null
  bgClass: string
  colorClass: string
  subtype: string
}

interface TrendingWeeklyProps {
  locale: Locale
  ctaLabel: string
  ctaHref: string
  // "mobile" : section autonome (titre + defilement horizontal de cartes).
  // "desktop" : liste verticale, le titre est pose par la page.
  variant?: "mobile" | "desktop"
  title?: string
}

// Carte compacte du defilement mobile.
function TrendingMobileCard({ item, href, subtype }: TrendingItemProps) {
  const rarity = item.rarity ?? "";
  const inner = (
    <>
      <span className={`flex h-30 items-center justify-center bg-linear-to-br ${RARITY_GRADIENT[rarity] ?? "from-transparent"} to-transparent`}>
        <Image src={entityIcon(item.entityType, item.icon)} alt="" width={96} height={96} className="size-24 object-contain" />
      </span>
      <span className="flex flex-col gap-0.5 px-2.5 py-2">
        <span className="truncate text-[13px] font-semibold text-foreground">{item.name}</span>
        <span className="truncate text-[11px] capitalize text-muted-foreground">
          {subtype}
          {item.rarity && (
            <>
              {" · "}
              <span className={RARITY_DECO[item.rarity] ?? ""}>{item.rarity}</span>
            </>
          )}
        </span>
      </span>
    </>
  );
  const className = `flex w-37 shrink-0 snap-start flex-col border border-foreground/10 border-b-2 bg-king-800 ${RARITY_BORDER_B[rarity] ?? "border-b-primary"}`;
  return href ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

export async function TrendingWeekly({ locale, ctaLabel, ctaHref, variant = "desktop", title }: TrendingWeeklyProps) {
  let items: PopularGlobalItem[] = [];
  let failed = false;
  try {
    items = await getTrending();
  } catch {
    failed = true;
  }

  // Garder uniquement les items rattaches a une fiche reelle (avec name/slug)
  // Survivors temporairement masques (soft-delete) — exclus du trending
  const top = items
    .filter((i) => i.name && i.slug)
    .filter((i) => i.entityType !== "survivor" && i.entityType !== "survivor-lead")
    .slice(0, 6);

  if (failed || top.length === 0) {
    const empty = (
      <p className="border border-king-700/50 bg-king-800/40 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur-sm">
        {failed ? "Trending data unavailable for now." : "No trending items yet — be the first to view some weapons!"}
      </p>
    );
    if (variant === "mobile") {
      return (
        <section className="flex flex-col gap-3 px-4 pt-7 pb-8">
          <h2 className="font-burbank text-[26px] uppercase leading-none text-primary-foreground">{title}</h2>
          {empty}
        </section>
      );
    }
    return (
      <div className="flex max-w-lg flex-col gap-4">
        {empty}
        <TrendingCTA href={ctaHref} label={ctaLabel} />
      </div>
    );
  }

  // Pre-calcul des props pour chaque item
  const itemsProps: TrendingItemProps[] = top.map((item) => ({
    item,
    href: entityHref(locale, item.entityType, item.slug as string),
    colorClass: (item.rarity && RARITY_DECO[item.rarity]) ?? "text-primary",
    bgClass: (item.rarity && RARITY_BG_DARK[item.rarity]) ?? "bg-king-800/65 hover:bg-king-800",
    subtype: entitySubtype(item),
  }));

  if (variant === "mobile") {
    return (
      <section className="flex flex-col gap-3 px-4 pt-7 pb-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-burbank text-[26px] uppercase leading-none text-primary-foreground">{title}</h2>
          <Link href={ctaHref} className="text-[13px] text-primary transition-colors hover:text-primary/80">
            {ctaLabel}
          </Link>
        </div>
        {/* Defilement libre plutot qu'un carrousel automatique : la carte
            suivante depasse du bord pour signaler qu'il y a une suite. */}
        <div className="-mr-4 flex snap-x snap-mandatory gap-2 overflow-x-auto pr-4 [scrollbar-width:none]">
          {itemsProps.map((p) => (
            <TrendingMobileCard key={`${p.item.entityType}-${p.item.entitySlug}`} {...p} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex max-w-lg flex-col gap-4">
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
