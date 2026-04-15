"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import type { WeaponDetail, RangedWeaponDetail, TierData, Perk, PerkSlot } from "@/lib/types/weapon"
import type { CalculatedStats } from "@/lib/types/calculate"
import { parsePerkBonuses, formatBonusValue } from "@/lib/perks"
import { weaponIconLarge } from "@/lib/cdn"
import { RARITY_TEXT, RARITY_BG, STAT_MAX, formatStatName } from "@/lib/constants"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, XIcon } from "lucide-react"
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
  modifiedStats: CalculatedStats | null
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
  modifiedStats,
}: ScreenshotDialogProps) {
  const templateRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [previewScale, setPreviewScale] = useState(0.5)
  const [weaponIconBase64, setWeaponIconBase64] = useState<string | null>(null)

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

  const updateScale = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth
      setPreviewScale(width / 1920)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(updateScale, 50)
    window.addEventListener("resize", updateScale)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", updateScale)
    }
  }, [open, updateScale])

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
      <DialogContent showCloseButton={false} className="w-fit max-w-[95vw] gap-0 overflow-hidden p-4 sm:max-w-[95vw]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <DialogTitle className="text-sm font-semibold">Screenshot Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button size="xs" onClick={handleDownload} disabled={downloading}>
              <Download className="size-3" />
              {downloading ? "Exporting..." : "Download PNG"}
            </Button>
            <Button size="icon-xs" variant="ghost" onClick={() => onOpenChange(false)}>
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div ref={containerRef} className="relative overflow-hidden rounded-lg" style={{ width: "min(92vw, 1600px)" }}>
          {downloading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg" style={{ background: "rgba(17, 8, 27, 0.85)" }}>
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
                <p className="text-sm font-medium text-muted-foreground">Exporting...</p>
              </div>
            </div>
          )}
          <div className="overflow-hidden" style={{ height: 1080 * previewScale }}>
            <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: 1920, height: 1080 }}>
              <ScreenshotTemplate
                ref={templateRef}
                weapon={weapon}
                tierData={tierData}
                selectedPerks={selectedPerks}
                slots={slots}
                isRanged={isRanged}
                weaponIconSrc={weaponIconBase64 ?? weaponIconLarge(weapon.icon, isRanged ? "weapons-ranged" : "weapons-melee")}
                baseStats={baseStats}
                modifiedStats={modifiedStats}
              />
            </div>
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
  modifiedStats: CalculatedStats
}

function ScreenshotTemplateInner(
  { weapon, tierData, selectedPerks, slots, isRanged, weaponIconSrc, baseStats, modifiedStats }: TemplateProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const rarityColor = RARITY_TEXT[weapon.rarity] ?? "text-gray-400"
  const isRangedWeapon = weapon.type === "ranged"

  const baseRecord = baseStats as unknown as Record<string, number>
  const modifiedRecord = modifiedStats as unknown as Record<string, number>

  const dpsMetrics = [
    { label: "DPS", value: modifiedStats.dps, base: baseStats.dps },
    { label: "CRIT DPS", value: modifiedStats.critDps, base: baseStats.critDps },
    { label: "AVG DPS", value: modifiedStats.avgDps, base: baseStats.avgDps },
    { label: "HS DPS", value: modifiedStats.headshotDps, base: baseStats.headshotDps },
    null,
    { label: "HIT", value: modifiedStats.damage, base: baseStats.damage },
    { label: "CRIT HIT", value: modifiedStats.damage * (1 + modifiedStats.critDamageMultiplier / 100), base: baseStats.damage * (1 + baseStats.critDamageMultiplier / 100) },
    { label: "CRIT %", value: modifiedStats.critChance, base: baseStats.critChance, suffix: "%" },
    { label: "CRIT X", value: modifiedStats.critDamageMultiplier, base: baseStats.critDamageMultiplier, suffix: "%" },
    null,
    { label: isRanged ? "FIRE RATE" : "ATK SPEED", value: isRanged ? modifiedStats.firingRate : (modifiedStats.attackSpeed ?? 0), base: isRanged ? baseStats.firingRate : (baseStats.attackSpeed ?? 0) },
    { label: "HS MULT", value: modifiedStats.headshotMultiplier, base: baseStats.headshotMultiplier, suffix: "%" },
  ]

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

      {/* Contenu */}
      <div className="relative z-10 flex size-full flex-col gap-3 p-6">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-2 pb-3" style={{ borderColor: "#4A2376" }}>
          <div className="flex items-center gap-4">
            <img src={weaponIconSrc} alt={weapon.name} className="size-24 object-contain" />
            <div>
              <p className="text-3xl font-bold uppercase leading-none">{weapon.name}</p>
              <p className="mt-1 text-lg" style={{ color: "#CAB0E8" }}>
                <span className={`font-semibold capitalize ${rarityColor}`}>{weapon.rarity}</span>
                {" / "}
                <span className="capitalize">{weapon.category}</span>
                {" / "}
                <span className="capitalize">{weapon.element}</span>
                {isRangedWeapon && <>{" / "}<span className="capitalize">{(weapon as RangedWeaponDetail).ammoType}</span></>}
                {" / "}
                <span className="capitalize">{tierData.displayTier}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-1 gap-3 overflow-hidden">
          <div className="flex flex-1 gap-3">

            {/* DPS Stats */}
            <div className="w-100 shrink-0 overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.2)" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                <p className="text-lg font-semibold">DPS - Stat</p>
              </div>
              <div className="space-y-2 p-5">
                {dpsMetrics.map((m, i) => {
                  if (m === null) return <div key={`sep-${i}`} className="my-4 h-0.5" style={{ background: "#9562D0" }} />
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

            {/* Stats avec barres */}
            <div className="flex-1 overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.2)" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                <p className="text-lg font-semibold">Stat</p>
              </div>
              <div className="space-y-3 p-5">
                {basicStatKeys.map((key) => {
                  const baseVal = baseRecord[key] ?? 0
                  const modVal = modifiedRecord[key] ?? baseVal
                  const delta = modVal - baseVal
                  const hasChange = Math.abs(delta) > 0.01
                  const max = STAT_MAX[key] ?? Math.max(baseVal * 2, 100)
                  const baseWidth = Math.min((baseVal / max) * 100, 100)
                  const modWidth = Math.min((modVal / max) * 100, 100)
                  return (
                    <div key={key}>
                      <div className="flex items-baseline gap-2">
                        <span className="min-w-0 flex-1 text-lg font-medium">{formatStatName(key)}</span>
                        <span className="shrink-0 text-right text-xl font-bold tabular-nums">{fmt(modVal)}</span>
                        <span className={`w-20 shrink-0 text-right text-base tabular-nums ${hasChange ? (delta > 0 ? "text-uncommon" : "text-malus") : ""}`} style={hasChange ? {} : { color: "#6E767A" }}>
                          {hasChange ? (delta > 0 ? "+" : "") + fmt(delta) : "0"}
                        </span>
                      </div>
                      <div className="relative mt-1 h-2 w-full overflow-hidden rounded-sm" style={{ background: "#4A2376" }}>
                        <div className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${baseWidth}%`, background: "#9562D0" }} />
                        {hasChange && delta > 0 && (
                          <div className="absolute inset-y-0 rounded-sm bg-uncommon" style={{ left: `${baseWidth}%`, width: `${modWidth - baseWidth}%` }} />
                        )}
                        {hasChange && delta < 0 && (
                          <div className="absolute inset-y-0 rounded-sm bg-malus" style={{ left: `${modWidth}%`, width: `${baseWidth - modWidth}%` }} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Craft */}
            <div className="w-100 shrink-0 overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.2)" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                <p className="text-lg font-semibold">Resources</p>
              </div>
              <div className="p-5">
                {tierData.evolution && tierData.evolution.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-base font-bold uppercase tracking-wide text-white">Evolution</p>
                    <div className="space-y-1.5">
                      {tierData.evolution.map((ing) => (
                        <div key={ing.name} className="flex items-center justify-between">
                          <span className="text-base capitalize" style={{ color: "#CAB0E8" }}>{cleanName(ing.name)}</span>
                          <span className="text-base font-bold tabular-nums" style={{ color: "#CAB0E8" }}>x{ing.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tierData.crafting.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-base font-bold uppercase tracking-wide text-white">Craft</p>
                    <div className="space-y-1.5">
                      {tierData.crafting.map((ing) => (
                        <div key={ing.name} className="flex items-center justify-between">
                          <span className="text-base capitalize" style={{ color: "#CAB0E8" }}>{cleanName(ing.name)}</span>
                          <span className="text-base font-bold tabular-nums" style={{ color: "#CAB0E8" }}>x{ing.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tierData.recycle && tierData.recycle.length > 0 && (
                  <div>
                    <p className="mb-2 text-base font-bold uppercase tracking-wide text-white">Recycle</p>
                    <div className="space-y-1.5">
                      {tierData.recycle.map((ing) => (
                        <div key={ing.name} className="flex items-center justify-between">
                          <span className="text-base capitalize" style={{ color: "#CAB0E8" }}>{cleanName(ing.name)}</span>
                          <span className="text-base font-bold tabular-nums" style={{ color: "#CAB0E8" }}>x{ing.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Droite : Perks + Weapon Perk */}
          <div className="flex w-87.5 shrink-0 flex-col gap-3">
            {weaponPerk && (
              <div className="overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376" }}>
                <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                  <p className="text-lg font-semibold">Weapon Perk</p>
                  {lastSlot && <span className="text-base" style={{ color: "#CAB0E8" }}>Lv.{lastSlot.unlockLevel}</span>}
                </div>
                <div className="p-5">
                  <p className="text-lg font-bold">{weaponPerk.name}</p>
                  <p className="mt-1 text-base leading-snug" style={{ color: "#CAB0E8" }}>{weaponPerk.description}</p>
                </div>
              </div>
            )}

            <div className="flex flex-1 flex-col overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.2)" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                <p className="text-lg font-semibold">Perks</p>
              </div>
              {activePerks.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-base" style={{ color: "#6E767A" }}>No perks selected</p>
                </div>
              ) : (
                activePerks.map(({ slot, perk }) => {
                  const perkBonuses = parsePerkBonuses(perk)

                  return (
                    <div key={slot.slot} className="flex flex-1 flex-col justify-center px-5 py-3" style={{ borderBottom: "1px solid #4A2376" }}>
                      <p className="text-sm font-medium uppercase" style={{ color: "#CAB0E8" }}>
                        Slot {slot.slot + 1} <span style={{ color: "#6E767A" }}>Lv.{slot.unlockLevel}</span>
                      </p>
                      <p className="mt-1 text-lg font-bold">{perk.name}</p>
                      {perkBonuses.length > 0 && (
                        <p className="mt-0.5 text-base font-semibold text-uncommon">
                          {perkBonuses.map((b) => `${formatBonusValue(b)} ${b.stat}`).join(", ")}
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex h-10 shrink-0 items-center justify-center gap-3">
          <FbcnLogo className="size-6" fill="#F2EBF9" />
          <span className="mt-0.5 text-lg font-bold uppercase tracking-widest text-white">FounderBacon</span>
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

function fmt(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2)
}
