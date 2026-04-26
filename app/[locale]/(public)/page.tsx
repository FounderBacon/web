import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LandingPage } from "@/components/public/LandingPage";
import { TrendingWeekly } from "@/components/public/TrendingWeekly";
import { UpdatesSection } from "@/components/public/UpdatesSection";
import { VentureDetails } from "@/components/public/VentureDetails";
import { SkeletonTrendingList, SkeletonUpdatesSection } from "@/components/ui/skeleton";
import { cleanVentureName, fetchCurrentVenture, type VentureWeek } from "@/lib/api/ventures";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { I18nText } from "@/lib/i18n-format";
import { isBeforeLaunch } from "@/lib/landing";

// ISR : la home est regeneree en cache cote serveur toutes les 5 minutes.
// Les API ventures/changelog/popular ne changent pas plus frequemment.
export const revalidate = 300;

const TITLE_BY_LOCALE: Record<string, string> = {
  en: "FounderBacon — Save the World companion",
  fr: "FounderBacon — Le compagnon Save the World",
};

const DESC_BY_LOCALE: Record<string, string> = {
  en: "Browse weapons, traps, heroes and survivors of Fortnite Save the World. Track perks, calculate damage, follow weekly rotations.",
  fr: "Explorez armes, pieges, heros et survivants de Fortnite Save the World. Suivez les perks, calculez les degats, suivez les rotations hebdomadaires.",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FounderBacon",
  url: "https://founderbacon.com",
  description: "The first free, open REST API for Fortnite: Save the World. Every weapon, every stat, every perk, every crafting recipe.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "All",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="sr-only">{TITLE_BY_LOCALE[locale] ?? TITLE_BY_LOCALE.en}</h1>
      <div className="relative w-full overflow-hidden md:h-[900px]">
        <Image src="/image/bg_home.png" alt="" fill priority sizes="100vw" className="object-cover blur-sm" />
        <div className="absolute inset-0 bg-king-800/10" />
        <div className="relative md:absolute md:inset-0">
          <div className="grid grid-cols-1 gap-10 px-8 py-10 md:h-full md:grid-cols-2 md:gap-6 md:px-12 md:py-12 lg:gap-8 lg:px-24 lg:py-14 xl:px-48 xl:py-16">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  <I18nText text={dict.home.breadcrumb} />
                </p>
                <p className="font-burbank text-5xl uppercase leading-none text-primary-foreground md:text-5xl lg:text-6xl xl:text-7xl">{ventureName ?? dict.home.seasonTitle}</p>
              </div>
              <div>
                <h2 className="mb-5 font-burbank text-2xl uppercase leading-none text-primary-foreground md:text-3xl">{dict.home.trendingWeekly}</h2>
                <Suspense fallback={<SkeletonTrendingList />}>
                  <TrendingWeekly locale={locale as Locale} ctaLabel={dict.home.browseAll} ctaHref={`/${locale}/search`} />
                </Suspense>
              </div>
            </div>
            <div className="flex flex-col items-center md:h-full md:justify-center">
              {venture && <VentureDetails venture={venture} />}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full bg-king-700 px-4 py-2 text-center md:px-10">
        <p className="text-xs font-medium uppercase tracking-wide text-primary-foreground md:text-sm">
          <I18nText text={dict.home.companion} />
        </p>
      </div>
      <Suspense fallback={<SkeletonUpdatesSection />}>
        <UpdatesSection locale={locale as Locale} />
      </Suspense>
    </>
  );
}
