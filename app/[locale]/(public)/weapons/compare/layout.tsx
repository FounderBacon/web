import type { Metadata } from "next"
import { JsonLd } from "@/components/common/JsonLd"
import { isValidLocale, type Locale } from "@/lib/i18n"
import { breadcrumbSchema } from "@/lib/jsonld"
import { pageAlternates } from "@/lib/seo"

interface Props {
  params: Promise<{ locale: string }>
  children: React.ReactNode
}

const DESCRIPTION =
  "Compare Fortnite Save the World weapons side by side: DPS, damage, crit, handling and durability, with your own perks and hero loadout applied."

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"

  return {
    title: "Weapon Compare | FounderBacon",
    description: DESCRIPTION,
    openGraph: {
      title: "Weapon Compare | FounderBacon",
      description: DESCRIPTION,
      type: "website",
    },
    alternates: pageAlternates(locale, "/weapons/compare"),
  }
}

export default async function WeaponCompareLayout({ children, params }: Props) {
  const { locale: raw } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: `/${locale}` },
            { name: "Weapons", url: `/${locale}/search/weapons` },
            { name: "Compare", url: `/${locale}/weapons/compare` },
          ]),
        ]}
      />
      {children}
    </>
  )
}
