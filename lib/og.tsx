import { readFile } from "node:fs/promises"
import { join } from "node:path"

// ─── Couleurs et constantes ───────────────────────────────────────

export const OG_RARITY_COLOR: Record<string, string> = {
  common: "#9CA3AF",
  uncommon: "#5BBB06",
  rare: "#02ACFC",
  epic: "#C953FC",
  legendary: "#F8A82A",
  mythic: "#E84B4B",
  ruby: "#FF1F4A",
  diamond: "#E5F1FA",
}

// Config commune aux opengraph-image.tsx (alt, size, contentType)
export const ogConfig = {
  alt: "FounderBacon",
  size: { width: 1200, height: 630 },
  contentType: "image/png" as const,
}

// ─── Fonts ────────────────────────────────────────────────────────

// Cache au niveau module : persiste tant que la fonction reste warm.
let cachedFonts: { burbank: Buffer; poppins: Buffer | null } | null = null

export async function loadOgFonts() {
  if (cachedFonts) return cachedFonts

  // Burbank en local (fichier deja present pour l'UI)
  const burbankPath = join(process.cwd(), "app/fonts/burbankbigcondensed_black.otf")
  const burbank = await readFile(burbankPath)

  // Poppins via Google Fonts (fetch CSS puis le .woff2)
  let poppins: Buffer | null = null
  try {
    const cssRes = await fetch("https://fonts.googleapis.com/css2?family=Poppins:wght@600&display=swap", {
      headers: {
        // User-Agent moderne pour obtenir du WOFF2 plutot que du TTF
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })
    const css = await cssRes.text()
    const fontUrl = css.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1]
    if (fontUrl) {
      const fontRes = await fetch(fontUrl)
      poppins = Buffer.from(await fontRes.arrayBuffer())
    }
  } catch {
    // fallback silencieux : Burbank suffira partout
  }

  cachedFonts = { burbank, poppins }
  return cachedFonts
}

// ─── Card generique ───────────────────────────────────────────────

export interface OgCardProps {
  // Petit label en haut (ex: "HERO", "WEAPON", "CHANGELOG")
  type: string
  // Titre principal (nom de l'entite ou version)
  title: string
  // Sous-titre optionnel (ex: "Soldier", "Sniper Rifle", "v0.3.0")
  subtitle?: string
  // Couleur d'accent : si rarity fournie -> couleur deduite, sinon couleur explicite
  rarity?: string
  accentColor?: string
  // Icone optionnelle a afficher a gauche
  iconUrl?: string | null
  // Mode pour les pages sans icone (ex: changelog) : version centree pleine largeur
  variant?: "with-icon" | "text-only"
}

function resolveAccent(rarity?: string, override?: string): string {
  if (override) return override
  if (rarity && OG_RARITY_COLOR[rarity.toLowerCase()]) return OG_RARITY_COLOR[rarity.toLowerCase()]
  return "#02ACFC"
}

export function ogCard({ type, title, subtitle, rarity, accentColor, iconUrl, variant = "with-icon" }: OgCardProps) {
  const accent = resolveAccent(rarity, accentColor)
  const showIcon = variant === "with-icon" && iconUrl

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        background: "linear-gradient(135deg, #0a0a0a 0%, #14141f 60%, #1a1a2e 100%)",
        position: "relative",
        fontFamily: "Poppins, sans-serif",
        color: "#ffffff",
      }}
    >
      {/* Bandeau couleur a gauche (accent rarete) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 14,
          height: "100%",
          background: accent,
        }}
      />

      {/* Halo de couleur en haut a droite (effet glow via gradient) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 700,
          height: 700,
          background: `radial-gradient(circle at 70% 30%, ${accent}33 0%, transparent 60%)`,
        }}
      />

      {/* Icone */}
      {showIcon && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 360,
            height: 360,
            margin: "auto 0 auto 80px",
            border: `4px solid ${accent}`,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse */}
          <img src={iconUrl!} alt="" width={320} height={320} style={{ objectFit: "contain" }} />
        </div>
      )}

      {/* Bloc texte */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          padding: showIcon ? "0 80px 0 56px" : "0 96px",
          gap: 20,
        }}
      >
        {/* Type label */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 8,
            color: accent,
            textTransform: "uppercase",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {type}
        </div>

        {/* Titre (Burbank) */}
        <div
          style={{
            fontSize: showIcon ? 92 : 132,
            fontFamily: "Burbank, sans-serif",
            color: "#ffffff",
            lineHeight: 0.95,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          {title}
        </div>

        {/* Sous-titre */}
        {subtitle && (
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: accent,
              textTransform: "capitalize",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            {subtitle}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 6,
            color: "#ffffff",
            textTransform: "uppercase",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          <span style={{ color: accent, fontSize: 32 }}>●</span>
          founderbacon.com
        </div>
      </div>
    </div>
  )
}

// ─── Helper pour construire le payload ImageResponse fonts ────────

export function ogFontList(fonts: Awaited<ReturnType<typeof loadOgFonts>>) {
  const list: { name: string; data: Buffer; style: "normal"; weight: 400 | 600 | 800 }[] = [
    { name: "Burbank", data: fonts.burbank, style: "normal", weight: 800 },
  ]
  if (fonts.poppins) {
    list.push({ name: "Poppins", data: fonts.poppins, style: "normal", weight: 600 })
  }
  return list
}
