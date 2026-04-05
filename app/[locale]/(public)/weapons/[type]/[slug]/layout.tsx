import type { Metadata } from "next"

interface Props {
  params: Promise<{ locale: string; type: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, slug } = await params
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase()).replace(/\s\w+$/, "")

  return {
    title: `${name} - ${type === "melee" ? "Melee" : "Ranged"} Weapon`,
    description: `Stats, perks, and crafting details for ${name} in Fortnite: Save the World.`,
    openGraph: {
      title: `${name} | FounderBacon`,
      description: `Build calculator for ${name} - Fortnite: Save the World`,
    },
  }
}

export default function WeaponLayout({ children }: { children: React.ReactNode }) {
  return children
}
