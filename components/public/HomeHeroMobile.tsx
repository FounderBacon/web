import Image from "next/image";
import Link from "next/link";
import { VentureCountdownBlocks } from "@/components/public/VentureCountdownBlocks";
import { parseVentureSeason, ventureEndDate, type VentureWeek } from "@/lib/api/ventures";
import type { getDictionary, Locale } from "@/lib/i18n";
import { I18nText } from "@/lib/i18n-format";

type HomeDict = Awaited<ReturnType<typeof getDictionary>>["home"];

interface HomeHeroMobileProps {
  locale: Locale;
  dict: HomeDict;
  venture: VentureWeek | null;
  ventureName: string | null;
}

/**
 * Heros de la home sous md : la venture en affiche plein ecran.
 *
 * Remplace, sur mobile seulement, le bloc venture encadre qui occupait tout le
 * premier ecran sans rien proposer a faire : ici le nom, le compte a rebours
 * et les deux actions principales tiennent dans le premier ecran.
 */
export function HomeHeroMobile({ locale, dict, venture, ventureName }: HomeHeroMobileProps) {
  const parsed = venture?.venturesSeason ? parseVentureSeason(venture.venturesSeason.raw) : null;
  const subtitle = [parsed?.element, parsed?.modifier].filter(Boolean).join(" · ");
  const rotatesAt = venture ? ventureEndDate(venture) : null;

  return (
    <section className="relative overflow-hidden md:hidden">
      <Image src="/image/bg_home.png" alt="" fill priority sizes="100vw" className="object-cover" />
      {/* Voile sombre plutot que le flou du desktop : a cette taille le
          decor flou ne se lisait plus que comme une tache. */}
      <div className="absolute inset-0 bg-king-980/60" />

      <div className="relative flex min-h-[560px] flex-col justify-end gap-4 px-4 pb-7 pt-24">
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <I18nText text={dict.breadcrumb} />
          </p>
          <p className="text-balance font-burbank text-[68px] uppercase leading-[0.92] text-primary-foreground">
            {ventureName ?? dict.seasonTitle}
          </p>
          {subtitle && <p className="text-[13px] capitalize text-king-100">{subtitle}</p>}
        </div>

        {(rotatesAt || venture?.questline?.leavesAt) && (
          <VentureCountdownBlocks
            rotatesAt={rotatesAt?.toISOString() ?? null}
            questlineEndsAt={venture?.questline?.leavesAt ?? null}
            labels={{
              rotatesIn: dict.ventureRotatesIn,
              rotatingNow: dict.rotatingNow,
              questlineEndsIn: dict.questlineEndsIn,
              units: dict.countdownUnits,
            }}
          />
        )}

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/${locale}/search/weapons`}
            className="flex h-12 items-center justify-center bg-primary font-burbank text-[19px] uppercase text-primary-foreground transition-colors hover:bg-primary/80"
          >
            {dict.exploreWeapons}
          </Link>
          <Link
            href={`/${locale}/hero-loadout`}
            className="flex h-12 items-center justify-center border border-primary-foreground bg-king-980/60 font-burbank text-[19px] uppercase text-primary-foreground transition-colors hover:bg-king-980/80"
          >
            {dict.buildLoadout}
          </Link>
        </div>
      </div>
    </section>
  );
}
