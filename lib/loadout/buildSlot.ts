import type { HeroDetail } from "@/lib/api/heroes"
import { fetchHeroPerk } from "@/lib/api/hero-perks"
import { nameToSlug } from "@/lib/cdn"
import type { LoadoutHeroSlot } from "./store"

// Strippe le " +" du nom commander ("Six Shooter +" -> "Six Shooter") puis slugify -> matche le perkId
export function perkIdFromName(name: string): string {
  return nameToSlug(name.replace(/\s\+$/, ""))
}

// Construit un LoadoutHeroSlot depuis un HeroDetail selon le type de slot.
// Resolve l'icone du perk via fetchHeroPerk (silencieux si erreur, fallback = perkId).
export async function buildHeroSlot(
  detail: HeroDetail,
  slotKind: "commander" | "support",
): Promise<LoadoutHeroSlot | null> {
  const perk = slotKind === "commander" ? detail.commanderPerk : detail.standardPerk
  if (!perk) return null

  const perkId = perkIdFromName(perk.name)
  let perkIcon = perkId
  try {
    const perkDetail = await fetchHeroPerk(perkId)
    perkIcon = perkDetail.icon
  } catch {
    // fallback : on garde le slug comme icon
  }

  return {
    heroSlug: detail.slug,
    heroName: detail.name,
    heroIconUrl: detail.iconUrl,
    heroClass: detail.heroClass,
    rarity: detail.rarity,
    perkId,
    perkName: perk.name,
    perkIcon,
    perkDescription: perk.description,
  }
}
