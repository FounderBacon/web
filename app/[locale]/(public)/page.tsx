import type { Metadata } from "next";
import Link from "next/link";
import { SectionContainer } from "@/components/public/SectionContainer";
import { FbcnLogo } from "@/components/svg/FbcnLogo";
import { Pattern1, Pattern1Mobile } from "@/components/svg/Pattern1";
import { Countdown } from "@/components/ui/countdown";
import { getDictionary, isValidLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "FounderBacon — Free REST API for Fortnite: Save the World",
  description: "The first free, open REST API for Fortnite: Save the World. Weapons, traps, heroes, stats, perks, crafting — all in one place, free forever.",
};

const TARGET_DATE = new Date("2026-04-16T23:59:59");
const isLanding = process.env.NEXT_PUBLIC_ENABLE_LANDING === "true";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FounderBacon",
  url: "https://founderbacon.com",
  description: "The first free, open REST API for Fortnite: Save the World. Every weapon, every stat, every perk, every crafting recipe.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

function LandingPage({ dict }: { dict: Awaited<ReturnType<typeof getDictionary>> }) {
  return (
    <div className="relative min-h-screen" style={{ background: "linear-gradient(to top right, #11081B -25%, #E5D8F3 65%)" }}>
      <Pattern1 className="absolute inset-0 z-10 hidden h-full w-full md:block" fit="cover" />
      <Pattern1Mobile className="absolute inset-0 z-10 block h-full w-full md:hidden" fit="cover" />
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <img src="/svg/fbcn_logo.svg" alt="" className="size-[480px] opacity-25" />
      </div>
      <div className="relative z-30 flex h-screen w-full flex-col items-center justify-center gap-4">
        <h1 className="font-burbank uppercase text-3xl text-king-950 md:text-8xl">{dict.home.title}</h1>
        <Countdown targetDate={TARGET_DATE} labels={dict.home.countdown} className="font-burbank uppercase text-4xl text-king-950 md:text-9xl" />
        <p className="font-burbank uppercase text-xl text-king-950 md:text-5xl">{dict.home.subtitle}</p>
      </div>
    </div>
  );
}

function HomePage({ dict, locale }: { dict: Awaited<ReturnType<typeof getDictionary>>; locale: string }) {
  return (
    <>
      <SectionContainer fullScreen className="flex flex-col items-center justify-center gap-2 -mt-16 px-4 md:px-0">
        <FbcnLogo className="pointer-events-none absolute size-64 opacity-5 md:size-125" />
        <h1 className="m-0 -mb-3 font-burbank text-center text-4xl uppercase leading-none text-foreground md:text-7xl">
          {dict.home.heroTitle1} {dict.home.heroTitle2}
        </h1>
        <p className="max-w-lg text-center text-sm leading-tight text-muted-foreground whitespace-pre-line md:text-lg">{dict.home.heroDescription}</p>
        <div className="flex flex-col gap-3 w-full items-center sm:flex-row sm:w-auto sm:gap-4">
          <Link href={`/${locale}/search`} className="w-full text-center bg-king-500 px-6 py-3 transition-colors hover:bg-king-600 sm:w-auto">
            <span className="-mb-1 block font-akkordeon-11 text-lg uppercase text-king-50 md:text-xl">{dict.home.ctaWeapons}</span>
          </Link>
          <Link href={`/${locale}`} className="group w-full text-center border-2 border-king-500 px-6 py-3 transition-colors hover:bg-king-600 hover:border-king-600 sm:w-auto">
            <span className="-mb-1 block font-akkordeon-11 text-lg uppercase text-foreground group-hover:text-king-50 md:text-xl">{dict.home.ctaDocs}</span>
          </Link>
        </div>
      </SectionContainer>
    </>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;

  const dict = await getDictionary(locale);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {isLanding ? <LandingPage dict={dict} /> : <HomePage dict={dict} locale={locale} />}
    </>
  );
}
