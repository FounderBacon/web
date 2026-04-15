"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { Locale } from "@/lib/i18n"
import type en from "@/lang/en.json"
import { fetchRangedWeapons, fetchMeleeWeapons } from "@/lib/api/weapons"
import type { WeaponSummary, MeleeWeaponSummary } from "@/lib/types/weapon"
import { weaponIcon } from "@/lib/cdn"

interface HomeWeaponPreviewProps {
  locale: Locale
  dict: typeof en
}

type AnyWeapon = (WeaponSummary | MeleeWeaponSummary) & { weaponType: "ranged" | "melee" }

function WeaponCard({ weapon, locale }: { weapon: AnyWeapon; locale: Locale }) {
  const rarityName = weapon.rarity === "mythic" ? "mythic" : weapon.rarity
  const topImg = `/card/top_${rarityName}.png`
  const bottomImg = `/card/bottom_${rarityName === "mythic" ? "lythic" : rarityName}.png`

  return (
    <Link
      href={`/${locale}/weapons/${weapon.weaponType}/${weapon.slug}`}
      className="group relative w-36 shrink-0 cursor-pointer transition-all duration-300 hover:scale-105 sm:w-40"
    >
      <img src={bottomImg} alt="" className="relative z-0 w-full" />
      <img src={weaponIcon(weapon.icon, weapon.weaponType === "ranged" ? "weapons-ranged" : "weapons-melee")} alt={weapon.name} className="absolute inset-0 z-10 m-auto size-24 object-contain drop-shadow-lg sm:size-28" />
      <img src={topImg} alt="" className="absolute inset-0 z-20 h-full w-full" />
      <span className="absolute bottom-[16%] left-2 z-30 text-[10px] uppercase text-white/60">{weapon.category}</span>
      <span className="absolute bottom-[5%] left-2 z-30 text-[11px] font-semibold leading-tight text-white sm:text-xs">{weapon.name}</span>
    </Link>
  )
}

export function HomeWeaponPreview({ locale, dict }: HomeWeaponPreviewProps) {
  const [weapons, setWeapons] = useState<AnyWeapon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchRangedWeapons({ limit: 12 }),
      fetchMeleeWeapons({ limit: 6 }),
    ])
      .then(([ranged, melee]) => {
        const r = ranged.data.map((w) => ({ ...w, weaponType: "ranged" as const }))
        const m = melee.data.map((w) => ({ ...w, weaponType: "melee" as const }))

        // Une arme par rarete par type
        const pick = (list: AnyWeapon[]) => {
          const seen = new Set<string>()
          return list.filter((w) => {
            if (seen.has(w.rarity)) return false
            seen.add(w.rarity)
            return true
          })
        }

        setWeapons([...pick(r), ...pick(m)])
      })
      .catch(() => setWeapons([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-250/400 w-36 shrink-0 animate-pulse bg-card/50 sm:w-40" />
        ))}
      </div>
    )
  }

  if (weapons.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-12">
      {/* Slider infini */}
      <div className="relative w-full overflow-hidden">
        {/* Masque degrade gauche/droite */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-16 bg-linear-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-16 bg-linear-to-l from-background to-transparent" />

        <div className="flex w-max animate-[marquee_30s_linear_infinite] gap-3 hover:paused">
          {/* Double les items pour la boucle infinie */}
          {[...weapons, ...weapons].map((weapon, i) => (
            <WeaponCard key={`${weapon.slug}-${i}`} weapon={weapon} locale={locale} />
          ))}
        </div>
      </div>

      <Link
        href={`/${locale}/search/weapons`}
        className="border-2 border-primary/60 px-10 py-3.5 transition-all hover:border-primary hover:bg-primary/10"
      >
        <span className="-mb-1 block text-lg font-semibold uppercase text-muted-foreground hover:text-foreground">{dict.home.arsenalCta}</span>
      </Link>
    </div>
  )
}
