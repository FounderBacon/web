import type { Metadata } from "next"
import { JsonLd } from "@/components/common/JsonLd"
import { isValidLocale, type Locale } from "@/lib/i18n"
import { breadcrumbSchema, thingPageSchema } from "@/lib/jsonld"
import { pageAlternates } from "@/lib/seo"

interface Props {
  params: Promise<{ locale: string; slug: string }>
  children: React.ReactNode
}

function nameFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  const name = nameFromSlug(slug)

  return {
    title: name,
    description: `Stats, perks, and crafting details for ${name} in Fortnite: Save the World.`,
    openGraph: {
      title: `${name} | FounderBacon`,
      description: `Build calculator for ${name} - Fortnite: Save the World`,
    },
    alternates: pageAlternates(locale, `/traps/${slug}`),
  }
}

export default async function TrapLayout({ children, params }: Props) {
  const { locale: raw, slug } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  const name = nameFromSlug(slug)
  const url = `/${locale}/traps/${slug}`

  return (
    <>
      <JsonLd
        data={[
          thingPageSchema({
            name,
            description: `Stats, perks and crafting details for ${name} in Fortnite: Save the World.`,
            url,
            category: "Trap",
          }),
          breadcrumbSchema([
            { name: "Home", url: `/${locale}` },
            { name: "Traps", url: `/${locale}/search/traps` },
            { name, url },
          ]),
        ]}
      />
      {children}
    </>
  )
}
