import { ImageResponse } from "next/og"
import { fetchSurvivor } from "@/lib/api/survivors"
import { loadOgFonts, ogCard, ogConfig, ogFontList } from "@/lib/og"

export const { alt, size, contentType } = ogConfig
export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export default async function SurvivorOgImage({ params }: Props) {
  const { slug } = await params
  const fonts = await loadOgFonts()
  const survivor = await fetchSurvivor(slug).catch(() => null)

  return new ImageResponse(
    ogCard({
      type: "Survivor",
      title: survivor?.name ?? "FounderBacon",
      subtitle: survivor ? `${survivor.rarity} • Tier ${survivor.tier}` : undefined,
      rarity: survivor?.rarity,
      iconUrl: survivor?.iconUrlLarge ?? survivor?.iconUrl ?? null,
    }),
    { ...size, fonts: ogFontList(fonts) },
  )
}
