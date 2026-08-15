import type { Metadata } from "next"
import { JsonLd } from "@/components/common/JsonLd"
import { fetchRangedWeapon, fetchMeleeWeapon } from "@/lib/api/weapons"
import { weaponIconLarge } from "@/lib/cdn"
import { isValidLocale, type Locale } from "@/lib/i18n"
import { breadcrumbSchema, thingPageSchema } from "@/lib/jsonld"
import { itemDescription, itemTitle, nameFromSlug, pageAlternates } from "@/lib/seo"
import type { WeaponDetail } from "@/lib/types/weapon"

interface Props {
  params: Promise<{ locale: string; type: string; slug: string }>
  children: React.ReactNode
}

// Le fetch est dedupe par Next entre generateMetadata et le layout :
// deux appels ici = une seule requete API.
async function getWeapon(type: string, slug: string): Promise<WeaponDetail | null> {
  try {
    return type === "melee" ? await fetchMeleeWeapon(slug) : await fetchRangedWeapon(slug)
  } catch {
    // API down ou slug inconnu : on retombe sur les metadonnees derivees du slug
    // plutot que de casser le rendu de la page.
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, type, slug } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  const weapon = await getWeapon(type, slug)

  const name = weapon?.name ?? nameFromSlug(slug, { stripRarity: true })
  const description = itemDescription({
    name,
    description: weapon?.description,
    qualifiers: [weapon?.rarity, weapon?.category],
    kind: "weapon",
  })

  return {
    title: itemTitle(name),
    description,
    openGraph: {
      title: `${name} | FounderBacon`,
      description,
      type: "article",
    },
    alternates: pageAlternates(locale, `/weapons/${type}/${slug}`),
  }
}

export default async function WeaponLayout({ children, params }: Props) {
  const { locale: raw, type, slug } = await params
  const locale: Locale = isValidLocale(raw) ? raw : "en"
  const weapon = await getWeapon(type, slug)

  const name = weapon?.name ?? nameFromSlug(slug, { stripRarity: true })
  const url = `/${locale}/weapons/${type}/${slug}`
  const description = itemDescription({
    name,
    description: weapon?.description,
    qualifiers: [weapon?.rarity, weapon?.category],
    kind: "weapon",
  })

  return (
    <>
      <JsonLd
        data={[
          thingPageSchema({
            name,
            description,
            url,
            category: weapon?.category ?? type,
            ...(weapon?.icon && {
              image: weaponIconLarge(
                weapon.icon,
                type === "melee" ? "weapons-melee" : "weapons-ranged",
              ),
            }),
          }),
          breadcrumbSchema([
            { name: "Home", url: `/${locale}` },
            { name: "Weapons", url: `/${locale}/search/weapons` },
            { name, url },
          ]),
        ]}
      />
      {children}
    </>
  )
}
