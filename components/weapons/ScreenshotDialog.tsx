"use client"

import React, { useRef, useState, useEffect, useMemo } from "react"
import { usePreviewScale } from "@/components/share/screenshot/usePreviewScale"
import type { WeaponDetail, RangedWeaponDetail, TierData, Perk, PerkSlot } from "@/lib/types/weapon"
import type { CalculatedStats } from "@/lib/types/calculate"
import { parsePerkBonuses, formatBonusValue } from "@/lib/perks"
import { perkIcon, teamPerkIcon, UNKNOWN_ICON, weaponIconLarge } from "@/lib/cdn"
import { RARITY_TEXT, STAT_MAX, formatStatName } from "@/lib/constants"
import { formatNumber } from "@/lib/format"
import type { LoadoutHeroSlot, LoadoutTeamPerk } from "@/lib/loadout/store"
import { qrUrl } from "@/lib/api/qr"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { ScreenshotQrCard } from "@/components/share/screenshot/ScreenshotQrCard"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, Download, XIcon } from "lucide-react"
import { domToJpeg } from "modern-screenshot"

interface ScreenshotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weapon: WeaponDetail
  tierData: TierData
  selectedPerks: Record<number, Perk | null>
  slots: PerkSlot[]
  isRanged: boolean
  baseStats: CalculatedStats | null
  heroStats?: CalculatedStats | null
  modifiedStats: CalculatedStats | null
  commander: LoadoutHeroSlot | null
  support: (LoadoutHeroSlot | null)[]
  teamPerks: LoadoutTeamPerk[]
  // Path partage (avec query params) pour le QR dans le screenshot
  sharePath: string
}

const RANGED_SCREENSHOT_STATS = ["damage", "dps", "impactDamage", "critChance", "critDamageMultiplier", "headshotMultiplier", "firingRate", "clipSize", "reloadTime", "durability"] as const
const MELEE_SCREENSHOT_STATS = ["damage", "dps", "impactDamage", "critChance", "critDamageMultiplier", "attackSpeed", "durability"] as const

export function ScreenshotDialog({
  open,
  onOpenChange,
  weapon,
  tierData,
  selectedPerks,
  slots,
  isRanged,
  baseStats,
  heroStats,
  modifiedStats,
  commander,
  support,
  teamPerks,
  sharePath,
}: ScreenshotDialogProps) {
  const templateRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const previewScale = usePreviewScale(open)
  const [weaponIconBase64, setWeaponIconBase64] = useState<string | null>(null)
  // Cache des icones loadout en base64 (key = URL CDN)
  const [loadoutIcons, setLoadoutIcons] = useState<Record<string, string>>({})
  // QR code SVG en data URL (pour eviter CORS dans domToJpeg)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  // Fallback unknown.png en base64 — utilise si une icone fail (CDN down, asset manquant)
  const [unknownIconBase64, setUnknownIconBase64] = useState<string | null>(null)

  // Pre-charge le fallback unknown au mount de la dialog
  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch(`/api/proxy-image?url=${encodeURIComponent(UNKNOWN_ICON)}`)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob || cancelled) return
        const reader = new FileReader()
        reader.onloadend = () => {
          if (!cancelled && typeof reader.result === "string") {
            setUnknownIconBase64(reader.result)
          }
        }
        reader.readAsDataURL(blob)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    async function loadIcon() {
      try {
        const cdnUrl = weaponIconLarge(weapon.icon, isRanged ? "weapons-ranged" : "weapons-melee")
        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(cdnUrl)}`)
        if (!res.ok) return
        const blob = await res.blob()
        const reader = new FileReader()
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setWeaponIconBase64(reader.result)
          }
        }
        reader.readAsDataURL(blob)
      } catch {
        // Fallback silencieux
      }
    }
    loadIcon()
  }, [open, weapon.icon, isRanged])

  // Pre-charge en base64 toutes les icones du loadout (heroes + perks + team perks)
  // Necessaire car domToJpeg embed les images, et le CDN n'est pas CORS-friendly
  useEffect(() => {
    if (!open) return
    const filledSupport = support.filter((s): s is LoadoutHeroSlot => s !== null)

    const urls = new Set<string>()
    if (commander) {
      urls.add(commander.heroIconUrl)
      urls.add(perkIcon(commander.perkName))
    }
    for (const s of filledSupport) {
      urls.add(s.heroIconUrl)
      urls.add(perkIcon(s.perkName))
    }
    for (const p of teamPerks) {
      urls.add(teamPerkIcon(p.name))
    }

    if (urls.size === 0) return
    let cancelled = false

    async function loadAll() {
      const entries = await Promise.all(
        Array.from(urls).map(async (url) => {
          try {
            const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`)
            if (!res.ok) return [url, null] as const
            const blob = await res.blob()
            return new Promise<readonly [string, string | null]>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                resolve([url, typeof reader.result === "string" ? reader.result : null])
              }
              reader.readAsDataURL(blob)
            })
          } catch {
            return [url, null] as const
          }
        }),
      )
      if (cancelled) return
      const map: Record<string, string> = {}
      for (const [url, b64] of entries) {
        if (b64) map[url] = b64
      }
      setLoadoutIcons(map)
    }

    loadAll()
    return () => {
      cancelled = true
    }
  }, [open, commander, support, teamPerks])

  // True quand toutes les images du screenshot sont pretes en base64
  // Note : on accepte sans loadoutIcons individuels si unknownIconBase64 est pret (fallback)
  const assetsReady = useMemo(() => {
    if (!unknownIconBase64) return false
    if (!weaponIconBase64) return false
    if (sharePath && !qrDataUrl) return false
    return true
  }, [unknownIconBase64, weaponIconBase64, qrDataUrl, sharePath])

  // Pre-charge le QR en data URL (le back retourne du SVG)
  useEffect(() => {
    if (!open || !sharePath) return
    let cancelled = false
    async function loadQr() {
      try {
        const res = await fetch(qrUrl(sharePath, 256))
        if (!res.ok) return
        const svg = await res.text()
        if (cancelled) return
        const encoded = typeof window !== "undefined" ? window.btoa(unescape(encodeURIComponent(svg))) : ""
        setQrDataUrl(`data:image/svg+xml;base64,${encoded}`)
      } catch {
        // silent
      }
    }
    loadQr()
    return () => {
      cancelled = true
    }
  }, [open, sharePath])

  async function handleDownload() {
    if (!templateRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await domToJpeg(templateRef.current, {
        width: 1920,
        height: 1080,
        scale: 2,
        quality: 0.9,
        fetch: {
          requestInit: { mode: "cors" },
          bypassingCache: true,
        },
      })
      const link = document.createElement("a")
      link.download = `${weapon.slug}-build.jpg`
      link.href = dataUrl
      link.click()
    } catch {
      // Fallback silencieux
    } finally {
      setDownloading(false)
    }
  }

  if (!baseStats || !modifiedStats) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-fit max-w-[95vw] gap-0 overflow-hidden bg-king-900 p-5 sm:max-w-[95vw]">
        {/* Header dialog : icone + titre + sous-titre, boutons a droite */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}>
              <Camera className="size-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-base font-semibold leading-tight">Screenshot Preview</DialogTitle>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: "#9562D0" }}>Ready to share</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleDownload} disabled={downloading || !assetsReady}>
              <Download className="size-3.5" />
              {!assetsReady ? "Loading..." : downloading ? "Exporting..." : "Download PNG"}
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => onOpenChange(false)}>
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* Cadre preview : dimensions calculees pour rester dans le viewport (largeur + hauteur) */}
        <div
          className="relative overflow-hidden rounded-lg"
          style={{
            width: 1920 * previewScale,
            height: 1080 * previewScale,
            border: "1px solid #4A2376",
          }}
        >
          <div className="pointer-events-none absolute right-3 top-3 z-10 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm" style={{ border: "1px solid #4A2376", background: "rgba(17, 8, 27, 0.7)", color: "#CAB0E8" }}>
            1920 × 1080
          </div>
          {downloading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "rgba(17, 8, 27, 0.85)" }}>
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
                <p className="text-sm font-medium text-muted-foreground">Exporting...</p>
              </div>
            </div>
          )}
          <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: 1920, height: 1080 }}>
              <ScreenshotTemplate
                ref={templateRef}
                weapon={weapon}
                tierData={tierData}
                selectedPerks={selectedPerks}
                slots={slots}
                isRanged={isRanged}
                weaponIconSrc={weaponIconBase64 ?? unknownIconBase64 ?? weaponIconLarge(weapon.icon, isRanged ? "weapons-ranged" : "weapons-melee")}
                baseStats={baseStats}
                heroStats={heroStats ?? baseStats}
                modifiedStats={modifiedStats}
                commander={commander}
                support={support}
                teamPerks={teamPerks}
                loadoutIcons={loadoutIcons}
                qrSrc={qrDataUrl}
                unknownIconSrc={unknownIconBase64}
              />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Template ───────────────────────────────────────────────────

interface TemplateProps {
  weapon: WeaponDetail
  tierData: TierData
  selectedPerks: Record<number, Perk | null>
  slots: PerkSlot[]
  isRanged: boolean
  weaponIconSrc: string
  baseStats: CalculatedStats
  heroStats: CalculatedStats
  modifiedStats: CalculatedStats
  commander: LoadoutHeroSlot | null
  support: (LoadoutHeroSlot | null)[]
  teamPerks: LoadoutTeamPerk[]
  loadoutIcons: Record<string, string>
  qrSrc: string | null
  unknownIconSrc: string | null
}

function ScreenshotTemplateInner(
  {
    weapon,
    tierData,
    selectedPerks,
    slots,
    isRanged,
    weaponIconSrc,
    baseStats,
    heroStats,
    modifiedStats,
    commander,
    support,
    teamPerks,
    loadoutIcons,
    qrSrc,
    unknownIconSrc,
  }: TemplateProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const filledSupport = support.filter((s): s is LoadoutHeroSlot => s !== null)
  const hasLoadout = !!commander || filledSupport.length > 0 || teamPerks.length > 0
  // Fallback : si l'icone n'est pas chargee, on utilise unknown.png en base64 (jamais d'URL CDN brute)
  const resolveIcon = (url: string) => loadoutIcons[url] ?? unknownIconSrc ?? url
  const rarityColor = RARITY_TEXT[weapon.rarity] ?? "text-gray-400"
  const isRangedWeapon = weapon.type === "ranged"

  const baseRecord = baseStats as unknown as Record<string, number>
  const heroRecord = heroStats as unknown as Record<string, number>
  const modifiedRecord = modifiedStats as unknown as Record<string, number>

  // Build des metrics : on garde seulement les paires (value, base) numeriques pour eviter
  // les crashs sur les armes qui n'exposent pas certains champs (ex: melee + headshot stats)
  type Metric = { label: string; value: number; base: number; suffix?: string } | null
  const rawMetrics: Metric[] = [
    pickMetric("DPS", modifiedStats.dps, baseStats.dps),
    pickMetric("CRIT DPS", modifiedStats.critDps, baseStats.critDps),
    pickMetric("AVG DPS", modifiedStats.avgDps, baseStats.avgDps),
    isRanged ? pickMetric("HS DPS", modifiedStats.headshotDps, baseStats.headshotDps) : null,
    null,
    pickMetric("HIT", modifiedStats.damage, baseStats.damage),
    pickMetric(
      "CRIT HIT",
      safeMul(modifiedStats.damage, modifiedStats.critDamageMultiplier),
      safeMul(baseStats.damage, baseStats.critDamageMultiplier),
    ),
    pickMetric("CRIT %", modifiedStats.critChance, baseStats.critChance, "%"),
    pickMetric("CRIT X", modifiedStats.critDamageMultiplier, baseStats.critDamageMultiplier, "%"),
    null,
    pickMetric(
      isRanged ? "FIRE RATE" : "ATK SPEED",
      isRanged ? modifiedStats.firingRate : modifiedStats.attackSpeed,
      isRanged ? baseStats.firingRate : baseStats.attackSpeed,
    ),
    isRanged ? pickMetric("HS MULT", modifiedStats.headshotMultiplier, baseStats.headshotMultiplier, "%") : null,
  ]
  // Compact les separateurs orphelins (deux nulls consecutifs apres filtrage)
  const dpsMetrics = compactSeparators(rawMetrics)

  const basicStatKeys = (isRanged ? RANGED_SCREENSHOT_STATS : MELEE_SCREENSHOT_STATS).filter((k) => k in baseRecord)

  const lastSlot = weapon.perkSlots[weapon.perkSlots.length - 1]
  const weaponPerk = lastSlot ? selectedPerks[lastSlot.slot] ?? lastSlot.availablePerks[0] : null

  const activePerks: { slot: PerkSlot; perk: Perk }[] = []
  for (const slot of slots) {
    const perk = selectedPerks[slot.slot]
    if (perk) activePerks.push({ slot, perk })
  }

  return (
    <div
      ref={ref}
      className="relative overflow-hidden font-sans"
      style={{ width: 1920, height: 1080, color: "#F2EBF9" }}
    >
      {/* Background */}
      <img src="/bg_plan.jpg" alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0" style={{ background: "rgba(17, 8, 27, 0.7)" }} />

      {/* Contenu : Gauche (Header + DPS+Stats + Footer) | Droite (Hero + Perks pleine hauteur) */}
      <div className="relative z-10 flex size-full gap-3 p-6">

        {/* Cote gauche : Header + DPS + Stats + Footer */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden">

          {/* Header v1 : icone + nom + tags slash, Level/Offensive dans panneau split */}
          <div className="flex shrink-0 items-center justify-between border-b px-2 pb-3" style={{ borderColor: "#4A2376" }}>
            <div className="flex items-center gap-4">
              <img src={weaponIconSrc} alt={weapon.name} className="size-24 object-contain" />
              <div>
                <p className="text-3xl font-bold uppercase leading-none">{weapon.name}</p>
                <p className="mt-1 text-lg" style={{ color: "#CAB0E8" }}>
                  <span className={`font-semibold capitalize ${rarityColor}`}>{weapon.rarity}</span>
                  {" / "}<span className="capitalize">{weapon.category}</span>
                  {" / "}<span className="capitalize">{weapon.element}</span>
                  {isRangedWeapon && <>{" / "}<span className="capitalize">{(weapon as RangedWeaponDetail).ammoType}</span></>}
                  {" / "}<span className="capitalize">{tierData.displayTier}</span>
                </p>
              </div>
            </div>

            {/* Level + Offensive : panneau split avec separateur central */}
            <div className="flex items-stretch overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}>
              <div className="flex flex-col items-center justify-center px-6 py-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "#9562D0" }}>Level</span>
                <span className="text-3xl font-bold tabular-nums leading-tight text-white">{modifiedStats.appliedBonuses?.level ?? 0}</span>
              </div>
              <div className="w-px" style={{ background: "#4A2376" }} />
              <div className="flex flex-col items-center justify-center px-6 py-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "#9562D0" }}>Offensive</span>
                <span className="text-3xl font-bold tabular-nums leading-tight text-white">+{modifiedStats.appliedBonuses?.offensive ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Row DPS + Stats */}
            <div className="flex flex-1 gap-3 overflow-hidden">
            {/* DPS Stats */}
            <div className="w-100 shrink-0 overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                <p className="text-lg font-semibold">DPS - Stat</p>
              </div>
              <div className="space-y-2 p-5">
                {dpsMetrics.map((m, i) => {
                  if (m === null) return <div key={`sep-${i}`} className="my-3 h-0.5" style={{ background: "#9562D0" }} />
                  const delta = m.value - m.base
                  const hasChange = Math.abs(delta) > 0.01
                  return (
                    <div key={m.label} className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 text-base" style={{ color: "#CAB0E8" }}>{m.label}</span>
                      <span className="shrink-0 text-right text-xl font-bold tabular-nums">{fmt(m.value)}{m.suffix ?? ""}</span>
                      <span className={`w-20 shrink-0 text-right text-base tabular-nums ${hasChange ? (delta > 0 ? "text-uncommon" : "text-malus") : ""}`} style={hasChange ? {} : { color: "#6E767A" }}>
                        {hasChange ? (delta > 0 ? "+" : "") + fmt(delta) : "0"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stats (col centrale) */}
            <div className="flex-1 overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                <p className="text-lg font-semibold">Stat</p>
              </div>
              <div className="space-y-3 p-5">
                {basicStatKeys.map((key) => {
                    const baseVal = baseRecord[key] ?? 0
                    const heroVal = heroRecord[key] ?? baseVal
                    const modVal = modifiedRecord[key] ?? heroVal
                    const totalDelta = modVal - baseVal
                    const heroDelta = heroVal - baseVal
                    const perksDelta = modVal - heroVal
                    const hasChange = Math.abs(totalDelta) > 0.01
                    const max = Math.max(STAT_MAX[key] ?? 0, modVal * 1.15, baseVal * 1.15, 1)
                    const pct = (n: number) => Math.max(0, Math.min((n / max) * 100, 100))
                    const baseW = pct(baseVal)
                    const heroW = pct(heroVal)
                    const modW = pct(modVal)
                    return (
                      <div key={key}>
                        <div className="flex items-baseline gap-2">
                          <span className="min-w-0 flex-1 text-lg font-medium">{formatStatName(key)}</span>
                          <span className="shrink-0 text-right text-xl font-bold tabular-nums">{fmt(modVal)}</span>
                          <span className={`w-20 shrink-0 text-right text-base tabular-nums ${hasChange ? (totalDelta > 0 ? "text-uncommon" : "text-malus") : ""}`} style={hasChange ? {} : { color: "#6E767A" }}>
                            {hasChange ? (totalDelta > 0 ? "+" : "") + fmt(totalDelta) : "0"}
                          </span>
                        </div>
                        <div className="relative mt-1 h-2 w-full overflow-hidden rounded-sm" style={{ background: "#4A2376" }}>
                          {/* Vraie base (violet) */}
                          <div className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${Math.min(baseW, heroW, modW)}%`, background: "#9562D0" }} />
                          {/* Bonus heros (legendary) */}
                          {heroDelta > 0 && (
                            <div className="absolute inset-y-0 rounded-sm bg-legendary" style={{ left: `${baseW}%`, width: `${Math.max(0, Math.min(heroW, modW) - baseW)}%` }} />
                          )}
                          {/* Bonus perks (uncommon) */}
                          {perksDelta > 0 && (
                            <div className="absolute inset-y-0 rounded-sm bg-uncommon" style={{ left: `${heroW}%`, width: `${Math.max(0, modW - heroW)}%` }} />
                          )}
                          {/* Malus heros (rouge) */}
                          {heroDelta < 0 && (
                            <div className="absolute inset-y-0 rounded-sm bg-malus" style={{ left: `${Math.max(heroW, modW)}%`, width: `${Math.max(0, baseW - Math.max(heroW, modW))}%` }} />
                          )}
                          {/* Malus perks (rouge) */}
                          {perksDelta < 0 && (
                            <div className="absolute inset-y-0 rounded-sm bg-malus" style={{ left: `${modW}%`, width: `${Math.max(0, heroW - modW)}%` }} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer : section encadree, plus genereuse en hauteur */}
            <div className="flex h-20 shrink-0 items-center justify-between gap-4 overflow-hidden rounded-lg px-6" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}>
              <div className="flex items-center gap-4">
                <FbcnLogo className="size-12" fill="#F2EBF9" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold uppercase leading-none tracking-widest text-white">FounderBacon</span>
                  <span className="mt-1.5 text-[11px] uppercase tracking-[0.3em]" style={{ color: "#9562D0" }}>Save the World Companion</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] uppercase tracking-widest" style={{ color: "#CAB0E8" }}>Free · Open · Companion</span>
                <span className="text-base font-bold uppercase tracking-widest text-white">founderbacon.com</span>
              </div>
            </div>
          </div>

            {/* Col droite du main : Weapon Perk + Craft + Hero Bonuses */}
            <div className="flex w-100 shrink-0 flex-col gap-3 overflow-hidden">
              {weaponPerk && (
                <div className="overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}>
                  <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                    <p className="text-lg font-semibold">Weapon Perk</p>
                    {lastSlot && (
                      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "#CAB0E8" }}>
                        Lv.<span className="text-white">{lastSlot.unlockLevel}</span>
                      </span>
                    )}
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-lg font-bold uppercase leading-tight text-white">{weaponPerk.name}</p>
                    <p className="mt-1.5 line-clamp-3 text-sm leading-snug" style={{ color: "#CAB0E8" }}>{weaponPerk.description}</p>
                  </div>
                </div>
              )}

              {/* Hero Bonuses détaillé (commander avec desc + supports nommés + team perks nommés) */}
              {hasLoadout && (
                <div className="flex flex-1 flex-col overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}>
                  <div className="px-5 py-2.5" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                    <p className="text-base font-semibold">Hero Bonuses</p>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    {commander && (
                      <div>
                        <p className="mb-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "#9562D0" }}>Commander</p>
                        <div className="flex gap-2.5 rounded p-2.5" style={{ background: "rgba(74, 35, 118, 0.4)" }}>
                          <div className="relative size-16 shrink-0">
                            <img src={resolveIcon(commander.heroIconUrl)} alt="" className="absolute inset-0 size-full rounded object-cover" />
                            <img src={resolveIcon(perkIcon(commander.perkName))} alt="" className="absolute bottom-0 right-0 size-7 rounded object-contain" style={{ background: "rgba(17, 8, 27, 0.9)", border: "1px solid #4A2376" }} />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <p className="truncate text-sm leading-tight" style={{ color: "#CAB0E8" }}>{commander.heroName} · <span className="capitalize">{commander.rarity}</span></p>
                            <p className="truncate text-base font-bold leading-tight">{commander.perkName}</p>
                            <p className="line-clamp-3 text-xs leading-snug" style={{ color: "#CAB0E8" }}>{commander.perkDescription}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {filledSupport.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "#9562D0" }}>
                          Support <span style={{ color: "#CAB0E8" }}>({filledSupport.length})</span>
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {filledSupport.map((s, i) => (
                            <div key={`${s.heroSlug}-${i}`} className="flex items-start gap-2.5 rounded p-2" style={{ background: "rgba(74, 35, 118, 0.4)" }}>
                              <div className="relative size-14 shrink-0">
                                <img src={resolveIcon(s.heroIconUrl)} alt="" className="absolute inset-0 size-full rounded object-cover" />
                                <img src={resolveIcon(perkIcon(s.perkName))} alt="" className="absolute bottom-0 right-0 size-6 rounded object-contain" style={{ background: "rgba(17, 8, 27, 0.9)", border: "1px solid #4A2376" }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs leading-tight" style={{ color: "#CAB0E8" }}>{s.heroName}</p>
                                <p className="truncate text-sm font-bold leading-tight">{s.perkName}</p>
                                <p className="line-clamp-2 text-[11px] leading-snug" style={{ color: "#CAB0E8" }}>{s.perkDescription}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {teamPerks.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "#9562D0" }}>
                          Team perks <span style={{ color: "#CAB0E8" }}>({teamPerks.length})</span>
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {teamPerks.map((p) => (
                            <div key={p.perkId} className="flex items-start gap-2 rounded p-2" style={{ background: "rgba(74, 35, 118, 0.4)" }}>
                              <img src={resolveIcon(teamPerkIcon(p.name))} alt="" className="size-8 shrink-0 object-contain" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold leading-tight">{p.name}</p>
                                <p className="line-clamp-2 text-[11px] leading-snug" style={{ color: "#CAB0E8" }}>{p.description ?? p.requirements}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Craft en dernier */}
              {tierData.crafting.length > 0 && (
                <div className="overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}>
                  <div className="px-5 py-2.5" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                    <p className="text-base font-semibold">Craft</p>
                  </div>
                  <div className="space-y-1 p-3">
                    {tierData.crafting.map((ing) => (
                      <div key={ing.name} className="flex items-center justify-between">
                        <span className="truncate text-sm capitalize" style={{ color: "#CAB0E8" }}>{cleanName(ing.name)}</span>
                        <span className="text-sm font-bold tabular-nums" style={{ color: "#CAB0E8" }}>x{fmt(ing.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right rail : Perks (hauteur naturelle) + QR section etendue (flex-1) */}
            <div className="flex w-87.5 shrink-0 flex-col gap-3">
              {/* Perks : prend tout l'espace au-dessus du QR (qui est shrink-0 h-100) */}
              <div className="flex flex-1 flex-col overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}>
                <div className="px-5 py-3" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                  <p className="text-lg font-semibold">Perks</p>
                </div>
                {activePerks.length === 0 ? (
                  <div className="flex items-center justify-center py-6">
                    <p className="text-base" style={{ color: "#6E767A" }}>No perks selected</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {activePerks.map(({ slot, perk }) => {
                      const perkBonuses = parsePerkBonuses(perk)
                      const tierColor = RARITY_TEXT[perk.rarity] ?? "text-foreground"
                      return (
                        <div key={slot.slot} className="px-5 py-3" style={{ borderBottom: "1px solid #4A2376" }}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "#CAB0E8" }}>
                              Slot {slot.slot + 1} <span style={{ color: "#6E767A" }}>· Lv.{slot.unlockLevel}</span>
                            </p>
                            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tierColor}`} style={{ border: "1px solid currentColor" }}>
                              {perk.rarity}
                            </span>
                          </div>
                          <p className="mt-1.5 text-lg font-bold uppercase leading-tight text-white">{perk.name}</p>
                          {perkBonuses.length > 0 && (
                            <p className="mt-1 text-sm leading-snug" style={{ color: "#CAB0E8" }}>
                              {perkBonuses.map((b, i) => (
                                <span key={i}>
                                  {i > 0 && ", "}
                                  <span className="font-semibold text-white">{formatBonusValue(b)}</span>
                                  <span> {b.stat}</span>
                                </span>
                              ))}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* QR : card a taille fixe (calibree sur le cas 4 perks max) */}
              <ScreenshotQrCard qrSrc={qrSrc} />
            </div>

      </div>
    </div>
  )
}

const ScreenshotTemplate = React.forwardRef(ScreenshotTemplateInner)

// ── Helpers ────────────────────────────────────────────────────

function cleanName(name: string): string {
  return (
    name
      .replace(/^(ingredient|reagent|schematicxp)_?/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (s) => s.toUpperCase()) || name
  )
}

const fmt = formatNumber

function pickMetric(
  label: string,
  value: number | undefined | null,
  base: number | undefined | null,
  suffix?: string,
): { label: string; value: number; base: number; suffix?: string } | null {
  if (typeof value !== "number" || typeof base !== "number") return null
  if (Number.isNaN(value) || Number.isNaN(base)) return null
  return { label, value, base, ...(suffix && { suffix }) }
}

function safeMul(a: number | undefined, b: number | undefined): number | undefined {
  if (typeof a !== "number" || typeof b !== "number") return undefined
  return a * (1 + b / 100)
}

// Retire les separateurs (null) en debut/fin et les doublons consecutifs
function compactSeparators<T>(arr: (T | null)[]): (T | null)[] {
  const out: (T | null)[] = []
  for (const item of arr) {
    if (item === null) {
      if (out.length === 0) continue
      if (out[out.length - 1] === null) continue
    }
    out.push(item)
  }
  while (out.length > 0 && out[out.length - 1] === null) out.pop()
  return out
}

