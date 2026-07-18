import { ImageResponse } from "next/og"
import { fetchHero } from "@/lib/api/heroes"
import { loadOgFonts, ogCard, ogConfig, ogFontList } from "@/lib/og"

export const { alt, size, contentType } = ogConfig
export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export default async function HeroOgImage({ params }: Props) {
  const { slug } = await params
  const fonts = await loadOgFonts()
  const hero = await fetchHero(slug).catch(() => null)

  return new ImageResponse(
    ogCard({
      type: "Hero",
      title: hero?.name ?? "FounderBacon",
      subtitle: hero?.heroClass,
      rarity: hero?.rarity,
      iconUrl: hero?.iconUrlLarge ?? hero?.iconUrl ?? null,
    }),
    { ...size, fonts: ogFontList(fonts) },
  )
}
