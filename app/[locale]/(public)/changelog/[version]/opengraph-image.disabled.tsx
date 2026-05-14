import { ImageResponse } from "next/og"
import { fetchChangelogBySlug } from "@/lib/api/changelog"
import { loadOgFonts, ogCard, ogConfig, ogFontList } from "@/lib/og"

export const { alt, size, contentType } = ogConfig
export const revalidate = 3600

interface Props {
  params: Promise<{ version: string }>
}

export default async function ChangelogOgImage({ params }: Props) {
  const { version: slug } = await params
  const fonts = await loadOgFonts()
  const entry = await fetchChangelogBySlug(slug).catch(() => null)

  return new ImageResponse(
    ogCard({
      type: "Changelog",
      title: entry ? `v${entry.version}` : "FounderBacon",
      subtitle: entry?.title,
      rarity: entry?.rarity,
      variant: "text-only",
    }),
    { ...size, fonts: ogFontList(fonts) },
  )
}
