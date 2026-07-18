import { ImageResponse } from "next/og"
import { fetchMeleeWeapon, fetchRangedWeapon } from "@/lib/api/weapons"
import { weaponIconLarge } from "@/lib/cdn"
import { loadOgFonts, ogCard, ogConfig, ogFontList } from "@/lib/og"

export const { alt, size, contentType } = ogConfig
export const revalidate = 3600

interface Props {
  params: Promise<{ type: string; slug: string }>
}

export default async function WeaponOgImage({ params }: Props) {
  const { type, slug } = await params
  const fonts = await loadOgFonts()

  const weapon =
    type === "melee"
      ? await fetchMeleeWeapon(slug).catch(() => null)
      : await fetchRangedWeapon(slug).catch(() => null)

  const isMelee = type === "melee"
  const iconUrl = weapon ? weaponIconLarge(weapon.icon, isMelee ? "weapons-melee" : "weapons-ranged") : null
  const subtitle = weapon
    ? `${weapon.rarity} • ${isMelee && "meleeClass" in weapon ? weapon.meleeClass : weapon.category}`
    : undefined

  return new ImageResponse(
    ogCard({
      type: isMelee ? "Melee Weapon" : "Ranged Weapon",
      title: weapon?.name ?? "FounderBacon",
      subtitle,
      rarity: weapon?.rarity,
      iconUrl,
    }),
    { ...size, fonts: ogFontList(fonts) },
  )
}
