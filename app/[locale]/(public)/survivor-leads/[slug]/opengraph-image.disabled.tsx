import { ImageResponse } from "next/og"
import { fetchSurvivorLead } from "@/lib/api/survivor-leads"
import { loadOgFonts, ogCard, ogConfig, ogFontList } from "@/lib/og"

export const { alt, size, contentType } = ogConfig
export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export default async function SurvivorLeadOgImage({ params }: Props) {
  const { slug } = await params
  const fonts = await loadOgFonts()
  const lead = await fetchSurvivorLead(slug).catch(() => null)

  return new ImageResponse(
    ogCard({
      type: "Survivor Lead",
      title: lead?.name ?? "FounderBacon",
      subtitle: lead ? `${lead.rarity} • ${lead.squadType.replace(/-/g, " ")}` : undefined,
      rarity: lead?.rarity,
      iconUrl: lead?.iconUrlLarge ?? lead?.iconUrl ?? null,
    }),
    { ...size, fonts: ogFontList(fonts) },
  )
}
