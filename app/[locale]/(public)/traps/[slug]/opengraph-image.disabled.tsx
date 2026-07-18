import { ImageResponse } from "next/og"
import { fetchTrap } from "@/lib/api/traps"
import { weaponIconLarge } from "@/lib/cdn"
import { loadOgFonts, ogCard, ogConfig, ogFontList } from "@/lib/og"

export const { alt, size, contentType } = ogConfig
export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export default async function TrapOgImage({ params }: Props) {
  const { slug } = await params
  const fonts = await loadOgFonts()
  const trap = await fetchTrap(slug).catch(() => null)

  const iconUrl = trap ? weaponIconLarge(trap.icon, "traps") : null
  const subtitle = trap ? `${trap.rarity} • ${trap.placement}` : undefined

  return new ImageResponse(
    ogCard({
      type: "Trap",
      title: trap?.name ?? "FounderBacon",
      subtitle,
      rarity: trap?.rarity,
      iconUrl,
    }),
    { ...size, fonts: ogFontList(fonts) },
  )
}
