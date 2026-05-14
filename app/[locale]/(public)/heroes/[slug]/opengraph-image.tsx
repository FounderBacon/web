import { ImageResponse } from "next/og"
import { fetchHero } from "@/lib/api/heroes"

// Genere une OG image dynamique 1200x630 par hero.
// Next.js cache automatiquement le resultat ; ISR-friendly via revalidate.

export const alt = "Hero card"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const revalidate = 3600

const RARITY_COLOR: Record<string, string> = {
  common: "#9ca3af",
  uncommon: "#5BBB06",
  rare: "#02ACFC",
  epic: "#C953FC",
  legendary: "#F8A82A",
  mythic: "#E84B4B",
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function HeroOgImage({ params }: Props) {
  const { slug } = await params

  let hero
  try {
    hero = await fetchHero(slug)
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0a",
            color: "#fff",
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          FounderBacon
        </div>
      ),
      size,
    )
  }

  const rarityColor = RARITY_COLOR[hero.rarity?.toLowerCase()] ?? "#9ca3af"
  const iconUrl = hero.iconUrlLarge ?? hero.iconUrl

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        {/* Bandeau couleur rarete */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 12,
            height: "100%",
            background: rarityColor,
          }}
        />

        {/* Icone */}
        {iconUrl && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 380,
              height: 380,
              marginRight: 56,
              alignSelf: "center",
              border: `4px solid ${rarityColor}`,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse */}
            <img src={iconUrl} alt="" width={340} height={340} style={{ objectFit: "contain" }} />
          </div>
        )}

        {/* Bloc texte */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 6,
              color: "#9ca3af",
              textTransform: "uppercase",
            }}
          >
            Hero
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            {hero.name}
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 8,
              fontSize: 32,
              color: rarityColor,
              textTransform: "capitalize",
              fontWeight: 600,
            }}
          >
            <span>{hero.rarity}</span>
            <span style={{ color: "#666" }}>•</span>
            <span style={{ color: "#fff" }}>{hero.heroClass}</span>
          </div>

          <div style={{ flex: 1 }} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 4,
              color: "#fff",
              textTransform: "uppercase",
            }}
          >
            <span style={{ color: rarityColor }}>●</span>
            founderbacon.com
          </div>
        </div>
      </div>
    ),
    size,
  )
}
