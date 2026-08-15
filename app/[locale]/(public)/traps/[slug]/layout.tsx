import type { Metadata } from "next"
import { JsonLd } from "@/components/common/JsonLd"
import { fetchTrap } from "@/lib/api/traps"
import { isValidLocale, type Locale } from "@/lib/i18n"
import { breadcrumbSchema, thingPageSchema } from "@/lib/jsonld"
import { itemDescription, itemTitle, nameFromSlug, pageAlternates } from "@/lib/seo"
import type { TrapDetail } from "@/lib/types/trap"

interface Props {
  params: Promise<{ locale: string; slug: string }>
  children: React.ReactNode
}

// Fetch dedupe par Next entre generateMetadata et le layout.
async function getTrap(slug: string): Promise<TrapDetail | null> {
  try {
    return await fetchTrap(slug)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  const trap = await getTrap(slug)

  const name = trap?.name ?? nameFromSlug(slug, { stripRarity: true })
  const description = itemDescription({
    name,
    description: trap?.description,
    qualifiers: [trap?.rarity, trap?.placement],
    kind: "trap",
  })

  return {
    title: itemTitle(name),
    description,
    openGraph: {
      title: `${name} | FounderBacon`,
      description,
      type: "article",
    },
    alternates: pageAlternates(locale, `/traps/${slug}`),
  }
}

export default async function TrapLayout({ children, params }: Props) {
  const { locale: raw, slug } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  const trap = await getTrap(slug)

  const name = trap?.name ?? nameFromSlug(slug, { stripRarity: true })
  const url = `/${locale}/traps/${slug}`
  const description = itemDescription({
    name,
    description: trap?.description,
    qualifiers: [trap?.rarity, trap?.placement],
    kind: "trap",
  })

  return (
    <>
      <JsonLd
        data={[
          thingPageSchema({
            name,
            description,
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
