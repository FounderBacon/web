import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LandingPage } from "@/components/public/LandingPage";
import { TrendingWeekly } from "@/components/public/TrendingWeekly";
import { UpdatesSection } from "@/components/public/UpdatesSection";
import { SkeletonTrendingList } from "@/components/ui/skeleton";
import { cleanVentureName, fetchCurrentVenture } from "@/lib/api/ventures";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { I18nText } from "@/lib/i18n-format";
import { isBeforeLaunch } from "@/lib/landing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FounderBacon — Free REST API for Fortnite: Save the World",
  description: "The first free, open REST API for Fortnite: Save the World. Weapons, traps, heroes, stats, perks, crafting — all in one place, free forever.",
};

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
  let ventureName: string | null = null;
  try {
    const venture = await fetchCurrentVenture();
    if (venture?.venturesSeason?.name) {
      ventureName = cleanVentureName(venture.venturesSeason.name);
    }
  } catch {
    // fallback silencieux sur dict.home.seasonTitle
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="relative h-[900px] w-full overflow-hidden">
        <Image src="/image/bg_home.png" alt="" fill priority sizes="100vw" className="object-cover blur-sm" />
        <div className="absolute inset-0 bg-king-800/10" />
        <div className="absolute inset-0">
          <div className="grid h-full grid-cols-1 gap-8 px-8 py-10 md:grid-cols-2 md:px-48 md:py-16">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  <I18nText text={dict.home.breadcrumb} />
                </p>
                <h1 className="font-burbank text-5xl uppercase leading-none text-primary-foreground md:text-7xl">{ventureName ?? dict.home.seasonTitle}</h1>
              </div>
              <div>
                <h2 className="mb-5 font-burbank text-2xl uppercase leading-none text-primary-foreground md:text-3xl">{dict.home.trendingWeekly}</h2>
                <Suspense fallback={<SkeletonTrendingList />}>
                  <TrendingWeekly locale={locale as Locale} ctaLabel={dict.home.browseAll} ctaHref={`/${locale}/search`} />
                </Suspense>
              </div>
            </div>
            <div />
          </div>
        </div>
      </div>
      <div className="w-full bg-king-700 px-4 py-2 text-center md:px-10">
        <p className="text-xs font-medium uppercase tracking-wide text-primary-foreground md:text-sm">
          <I18nText text={dict.home.companion} />
        </p>
      </div>
      <UpdatesSection locale={locale as Locale} />
    </>
  );
}
