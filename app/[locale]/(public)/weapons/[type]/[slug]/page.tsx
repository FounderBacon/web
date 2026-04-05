"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { fetchRangedWeapon, fetchMeleeWeapon } from "@/lib/api/weapons"
import type { WeaponDetail, RangedWeaponDetail, TierData, TierEntry, Perk } from "@/lib/types/weapon"
import { isTierSplit } from "@/lib/types/weapon"
import { SectionContainer } from "@/components/public/SectionContainer"
import { weaponIconLarge } from "@/lib/cdn"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { Arrow } from "@/components/svg/Arrow"
import { PerkSelector } from "@/components/weapons/PerkSelector"
import { StatsPanel } from "@/components/weapons/StatsPanel"
import { CraftingPanel } from "@/components/weapons/CraftingPanel"
import { DpsCalculator } from "@/components/weapons/DpsCalculator"
import { Card, CardContent } from "@/components/ui/card"
import { domToPng } from "modern-screenshot"

import { RARITY_TEXT } from "@/lib/constants"

const chip = (active: boolean) =>
  `cursor-pointer px-3 py-1.5 text-sm capitalize transition-colors ${active ? "bg-king-500 text-king-50" : "border border-king-700 text-muted-foreground hover:bg-king-800 hover:text-king-50"}`

export default function WeaponPage() {
  const params = useParams<{ locale: string; type: string; slug: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [weapon, setWeapon] = useState<WeaponDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tier, setTier] = useState(searchParams.get("t") ?? "1")
  const [material, setMaterial] = useState<"ore" | "crystal">((searchParams.get("m") as "ore" | "crystal") ?? "ore")
  const [selectedPerks, setSelectedPerks] = useState<Record<number, Perk | null>>({})
  const [previewPerk, setPreviewPerk] = useState<Perk | null>(null)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const buildRef = useRef<HTMLDivElement>(null)
  const initialParamsRef = useRef(Object.fromEntries(searchParams.entries()))

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(false)
      try {
        const data = params.type === "melee"
          ? await fetchMeleeWeapon(params.slug)
          : await fetchRangedWeapon(params.slug)
        setWeapon(data)

        // Restaurer les perks depuis l'URL initiale
        const init = initialParamsRef.current
        const perks: Record<number, Perk | null> = {}
        for (const slot of data.perkSlots) {
          const perkId = init[`p${slot.slot}`]
          if (perkId) {
            const found = slot.availablePerks.find((p) => p.perkId === perkId)
            if (found) perks[slot.slot] = found
          }
        }
        if (Object.keys(perks).length > 0) setSelectedPerks(perks)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.type, params.slug])

  // Construire l'URL de partage
  const buildShareUrl = useCallback(() => {
    const url = new URL(window.location.href)
    url.search = ""
    url.searchParams.set("t", tier)
    url.searchParams.set("m", material)
    for (const [slot, perk] of Object.entries(selectedPerks)) {
      if (perk) url.searchParams.set(`p${slot}`, perk.perkId)
    }
    return url.toString()
  }, [tier, material, selectedPerks])

  // Sync URL sans recharger la page
  useEffect(() => {
    if (!weapon) return
    const url = new URL(window.location.href)
    url.search = ""
    url.searchParams.set("t", tier)
    url.searchParams.set("m", material)
    for (const [slot, perk] of Object.entries(selectedPerks)) {
      if (perk) url.searchParams.set(`p${slot}`, perk.perkId)
    }
    window.history.replaceState(null, "", url.pathname + url.search)
  }, [tier, material, selectedPerks, weapon])

  async function handleExport() {
    if (!buildRef.current) return
    setExporting(true)
    try {
      const dataUrl = await domToPng(buildRef.current, {
        scale: 2,
      })
      const link = document.createElement("a")
      link.download = `${weapon?.slug ?? "build"}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setExporting(false)
    }
  }

  async function handleShare() {
    const url = buildShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback silencieux
    }
  }

  if (loading) {
    return (
      <SectionContainer className="flex items-center justify-center py-40">
        <div className="size-10 animate-spin rounded-full border-2 border-king-700 border-t-king-400" />
      </SectionContainer>
    )
  }

  if (error || !weapon) {
    return (
      <SectionContainer className="flex flex-col items-center justify-center gap-4 py-40">
        <p className="font-akkordeon-11 text-xl uppercase text-muted-foreground">Weapon not found</p>
        <Link href={`/${params.locale}/search`} className="text-king-500 underline underline-offset-4 hover:text-king-400">Back to search</Link>
      </SectionContainer>
    )
  }

  const rarityName = weapon.rarity === "mythic" ? "mythic" : weapon.rarity
  const topImg = `/card/top_${rarityName}.png`
  const bottomImg = `/card/bottom_${rarityName}.png`
  const rarityColor = RARITY_TEXT[weapon.rarity] ?? "text-muted-foreground"
  const isRanged = weapon.type === "ranged"
  const tierEntry: TierEntry | undefined = weapon.tiers[tier]
  const hasSplit = tierEntry ? isTierSplit(tierEntry) : false
  const tierData: TierData | undefined = tierEntry
    ? isTierSplit(tierEntry) ? tierEntry[material] : tierEntry
    : undefined

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Search", item: `https://founderbacon.com/${params.locale}/search` },
      { "@type": "ListItem", position: 2, name: params.type, item: `https://founderbacon.com/${params.locale}/search?type=${params.type}` },
      { "@type": "ListItem", position: 3, name: weapon.category },
      { "@type": "ListItem", position: 4, name: weapon.name },
    ],
  }

  return (
    <SectionContainer className="mx-auto max-w-7xl px-4 py-8 md:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <FbcnLogo className="pointer-events-none absolute right-0 top-0 size-64 opacity-[0.03] md:size-96" />

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/${params.locale}/search`} className="hover:text-foreground transition-colors">Search</Link>
        <span>/</span>
        <span className="capitalize">{params.type}</span>
        <span>/</span>
        <span className="capitalize">{weapon.category}</span>
        <span>/</span>
        <span className="text-foreground">{weapon.name}</span>
      </nav>

      {/* Tier selector + share */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.keys(weapon.tiers).map((t) => {
          const entry = weapon.tiers[t]
          const td = entry ? (isTierSplit(entry) ? entry[material] : entry) : null
          return (
            <button key={t} type="button" onClick={() => setTier(t)} className={chip(tier === t)}>
              {td ? `${td.displayTier} ${td.levelRange.min}-${td.levelRange.max}` : `Tier ${t}`}
            </button>
          )
        })}
        {hasSplit && (
          <>
            <span className="mx-1 text-king-700">|</span>
            <button type="button" onClick={() => setMaterial("ore")} className={chip(material === "ore")}>Ore</button>
            <button type="button" onClick={() => setMaterial("crystal")} className={chip(material === "crystal")}>Crystal</button>
          </>
        )}
        <div className="ml-auto flex gap-2">
          {/* <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="cursor-pointer border border-border px-3 py-1 font-akkordeon-11 text-sm uppercase text-muted-foreground transition-colors hover:border-king-500 hover:text-foreground disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Screenshot"}
          </button> */}
          <button
            type="button"
            onClick={handleShare}
            className="cursor-pointer border border-border px-3 py-1 font-akkordeon-11 text-sm uppercase text-muted-foreground transition-colors hover:border-king-500 hover:text-foreground"
          >
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>

      {/* 4 colonnes : DPS | Stats | Perks | Info */}
      {tierData && (
        <div ref={buildRef} className="mt-6 grid gap-6 p-4 lg:grid-cols-[160px_minmax(0,2fr)_minmax(0,3fr)_240px]">
          <div>
            <h2 className="mb-3 font-burbank text-xl uppercase text-foreground">DPS</h2>
            <DpsCalculator tierData={tierData} selectedPerks={selectedPerks} isRanged={isRanged} />
          </div>
          <div>
            <h2 className="mb-3 font-burbank text-xl uppercase text-foreground">Stats</h2>
            <StatsPanel tierData={tierData} selectedPerks={selectedPerks} previewPerk={previewPerk} />
          </div>

          <div className="lg:border-x lg:border-border/30 lg:px-6">
            <h2 className="mb-3 font-burbank text-xl uppercase text-foreground">Perk Builder</h2>
            <PerkSelector
              slots={weapon.perkSlots.slice(0, -1)}
              selectedPerks={selectedPerks}
              onSelect={(slot, perk) => setSelectedPerks((prev) => ({ ...prev, [slot]: perk }))}
              onHover={setPreviewPerk}
            />
          </div>

          <div className="flex flex-col items-start gap-4">
            <div className="relative w-48">
              <img src={bottomImg} alt="" className="relative z-0 w-full" />
              <img src={weaponIconLarge(weapon.icon)} alt={weapon.name} className="absolute inset-0 z-10 m-auto size-32 object-contain drop-shadow-xl" />
              <img src={topImg} alt="" className="absolute inset-0 z-20 h-full w-full" />
            </div>

            <div>
              <h1 className="font-burbank text-2xl uppercase text-foreground">{weapon.name}</h1>
              <span className={`font-akkordeon-11 text-sm uppercase ${rarityColor}`}>{weapon.rarity}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="border border-border px-2 py-0.5 text-sm capitalize text-muted-foreground">{weapon.element}</span>
              <span className="border border-border px-2 py-0.5 text-sm capitalize text-muted-foreground">{weapon.category}</span>
              {isRanged && <span className="border border-border px-2 py-0.5 text-sm capitalize text-muted-foreground">{(weapon as RangedWeaponDetail).ammoType}</span>}
              {weapon.isFounders && <span className="border border-legendary px-2 py-0.5 text-sm uppercase text-legendary">Founders</span>}
            </div>

            {weapon.description && (
              <p className="text-sm leading-relaxed text-foreground/70">{weapon.description}</p>
            )}

            {weapon.perkSlots.length > 0 && (() => {
              const lastSlot = weapon.perkSlots[weapon.perkSlots.length - 1]
              const perk = selectedPerks[lastSlot.slot] ?? lastSlot.availablePerks[0]
              return (
                <section>
                  <h2 className="mb-2 font-burbank text-lg uppercase text-foreground">Weapon Perk</h2>
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{perk?.name}</p>
                        <span className="text-xs text-muted-foreground">Lv.{lastSlot.unlockLevel}</span>
                      </div>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground">{perk?.description}</p>
                    </CardContent>
                  </Card>
                </section>
              )
            })()}

            <section>
              <h2 className="mb-2 font-burbank text-lg uppercase text-foreground">Resources</h2>
              <CraftingPanel crafting={tierData.crafting} recycle={tierData.recycle} evolution={tierData.evolution} />
            </section>
          </div>
        </div>
      )}
    </SectionContainer>
  )
}
