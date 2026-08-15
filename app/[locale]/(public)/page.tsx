import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { JsonLd } from "@/components/common/JsonLd";
import { LandingPage } from "@/components/public/LandingPage";
import { TrendingWeekly } from "@/components/public/TrendingWeekly";
import { UpdatesSection } from "@/components/public/UpdatesSection";
import { VentureDetails } from "@/components/public/VentureDetails";
import { SkeletonTrendingList, SkeletonUpdatesSection } from "@/components/ui/skeleton";
import { cleanVentureName, fetchCurrentVenture, type VentureWeek } from "@/lib/api/ventures";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { I18nText } from "@/lib/i18n-format";
import { softwareAppSchema, websiteSchema } from "@/lib/jsonld";
import { isBeforeLaunch } from "@/lib/landing";

// ISR : la home est regeneree en cache cote serveur toutes les 5 minutes.
// Les API ventures/changelog/popular ne changent pas plus frequemment.
export const revalidate = 300;

const TITLE_BY_LOCALE: Record<string, string> = {
  en: "FounderBacon — Save the World companion",
  fr: "FounderBacon — Le compagnon Save the World",
};

const DESC_BY_LOCALE: Record<string, string> = {
  en: "Browse weapons, traps and heroes of Fortnite Save the World. Track perks, calculate damage, follow weekly rotations.",
  fr: "Explorez armes, pieges et heros de Fortnite Save the World. Suivez les perks, calculez les degats, suivez les rotations hebdomadaires.",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL("https://founderbacon.com"),
    title: TITLE_BY_LOCALE[locale] ?? TITLE_BY_LOCALE.en,
    description: DESC_BY_LOCALE[locale] ?? DESC_BY_LOCALE.en,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        fr: "/fr",
        "x-default": "/en",
      },
    },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;

  const dict = await getDictionary(locale);

  // Avant la date de launch : on affiche la landing avec le countdown.
  if (isBeforeLaunch()) {
    return <LandingPage title={dict.home.title} subtitle={dict.home.subtitle} countdown={dict.home.countdown} />;
  }

  // Venture courant via API (fallback sur le dict si l'API echoue)
  let venture: VentureWeek | null = null;
  let ventureName: string | null = null;
  try {
    venture = await fetchCurrentVenture();
    if (venture?.venturesSeason?.name) {
      ventureName = cleanVentureName(venture.venturesSeason.name);
    }
  } catch {
    // fallback silencieux sur dict.home.seasonTitle
  }

  return (
    <>
      <JsonLd data={[websiteSchema(locale as Locale), softwareAppSchema(locale as Locale)]} />
      <h1 className="sr-only">{TITLE_BY_LOCALE[locale] ?? TITLE_BY_LOCALE.en}</h1>
      <div className="relative w-full overflow-hidden md:h-[900px]">
        <Image src="/image/bg_home.png" alt="" fill priority sizes="100vw" className="object-cover blur-sm" />
        <div className="absolute inset-0 bg-king-800/10" />
        <div className="relative md:absolute md:inset-0">
          <div className="grid grid-cols-1 gap-8 px-5 py-8 sm:px-8 md:h-full md:grid-cols-2 md:gap-6 md:px-12 md:py-12 lg:gap-8 lg:px-24 lg:py-14 xl:px-48 xl:py-16">
            {/* 3 cellules distinctes plutot qu'un TrendingWeekly duplique :
                l'ordre mobile (titre -> venture -> trending) est obtenu via
                order-*, et le placement grille en md+ via col-start/row-start.
                Un seul rendu de TrendingWeekly = un seul appel API. */}
            <div className="order-1 flex flex-col gap-2 md:order-0 md:col-start-1 md:row-start-1 md:self-end">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground sm:text-xs">
                <I18nText text={dict.home.breadcrumb} />
              </p>
              {/* text-balance evite les noms de venture coupes en veuve sur mobile */}
              <p className="text-balance font-burbank text-4xl uppercase leading-[0.95] text-primary-foreground sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl">{ventureName ?? dict.home.seasonTitle}</p>
            </div>

            <div className="order-2 flex flex-col md:order-0 md:col-start-2 md:row-span-2 md:row-start-1 md:h-full md:justify-center">
              {venture && <VentureDetails venture={venture} />}
            </div>

            <div className="order-3 md:order-0 md:col-start-1 md:row-start-2 md:self-start">
              <h2 className="mb-4 font-burbank text-2xl uppercase leading-none text-primary-foreground md:mb-5 md:text-3xl">{dict.home.trendingWeekly}</h2>
              <Suspense fallback={<SkeletonTrendingList />}>
                <TrendingWeekly locale={locale as Locale} ctaLabel={dict.home.browseAll} ctaHref={`/${locale}/search`} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full bg-king-700 px-5 py-2.5 text-center md:px-10 md:py-2">
        <p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-primary-foreground sm:text-xs md:text-sm">
          <I18nText text={dict.home.companion} />
        </p>
      </div>
      <Suspense fallback={<SkeletonUpdatesSection />}>
        <UpdatesSection locale={locale as Locale} />
      </Suspense>
    </>
  );
}
