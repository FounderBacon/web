"use client"

import React, { useRef, useState, useEffect, useMemo } from "react"
import { Camera, Download, RotateCw, XIcon } from "lucide-react"
import { domToJpeg } from "modern-screenshot"
import { usePreviewScale } from "@/components/share/screenshot/usePreviewScale"
import { ScreenshotQrCard } from "@/components/share/screenshot/ScreenshotQrCard"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { qrUrl } from "@/lib/api/qr"
import type { TrapCalculatedStats } from "@/lib/api/traps"
import { UNKNOWN_ICON, weaponIconLarge } from "@/lib/cdn"
import { RARITY_TEXT, STAT_MAX, formatStatName } from "@/lib/constants"
import { formatNumber } from "@/lib/format"
import type { TrapDetail } from "@/lib/types/trap"
import type { TierData } from "@/lib/types/shared"
import type { Perk, PerkSlot } from "@/lib/types/weapon"

interface TrapScreenshotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trap: TrapDetail
  tierData: TierData
  selectedPerks: Record<number, Perk | null>
  slots: PerkSlot[]
  baseStats: TrapCalculatedStats | null
  modifiedStats: TrapCalculatedStats | null
  // Path partage (avec query params) pour le QR dans le screenshot
  sharePath: string
}

const TRAP_SCREENSHOT_STATS = [
  "damage",
  "dps",
  "impactDamage",
  "critChance",
  "critDamageMultiplier",
  "armTime",
  "fireDelay",
  "reloadTime",
  "durability",
] as const

export function TrapScreenshotDialog({
  open,
  onOpenChange,
  trap,
  tierData,
  selectedPerks,
  slots,
  baseStats,
  modifiedStats,
  sharePath,
}: TrapScreenshotDialogProps) {
  const templateRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const previewScale = usePreviewScale(open)
  const [trapIconBase64, setTrapIconBase64] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [unknownIconBase64, setUnknownIconBase64] = useState<string | null>(null)

  // Pre-charge le fallback unknown
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

  // Pre-charge l'icone trap en base64
  useEffect(() => {
    if (!open) return
    async function loadIcon() {
      try {
        const cdnUrl = weaponIconLarge(trap.icon, "traps")
        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(cdnUrl)}`)
        if (!res.ok) return
        const blob = await res.blob()
        const reader = new FileReader()
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setTrapIconBase64(reader.result)
          }
        }
        reader.readAsDataURL(blob)
      } catch {
        // silent
      }
    }
    loadIcon()
  }, [open, trap.icon])

  // Pre-charge le QR en data URL
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

  const assetsReady = useMemo(() => {
    if (!unknownIconBase64) return false
    if (!trapIconBase64) return false
    if (sharePath && !qrDataUrl) return false
    return true
  }, [unknownIconBase64, trapIconBase64, qrDataUrl, sharePath])

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
      link.download = `${trap.slug}-build.jpg`
      link.href = dataUrl
      link.click()
    } catch {
      // silent
    } finally {
      setDownloading(false)
    }
  }

  if (!baseStats || !modifiedStats) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-fit max-w-[calc(100%-1rem)] gap-0 overflow-hidden bg-king-900 p-3 sm:max-w-[95vw] sm:p-5"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}
            >
              <Camera className="size-4 text-primary" />
            </div>
            <div className="flex min-w-0 flex-col">
              <DialogTitle className="truncate text-base font-semibold leading-tight">
                Screenshot Preview
              </DialogTitle>
              <p className="hidden text-[11px] uppercase tracking-widest sm:block" style={{ color: "#9562D0" }}>
                Ready to share
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" onClick={handleDownload} disabled={downloading || !assetsReady}>
              <Download className="size-3.5" />
              <span className="hidden sm:inline">
                {!assetsReady ? "Loading..." : downloading ? "Exporting..." : "Download JPG"}
              </span>
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => onOpenChange(false)}>
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* Hint mobile portrait */}
        <div className="mb-3 hidden items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground portrait:max-md:flex">
          <RotateCw className="size-3.5 shrink-0 text-primary" />
          <span>Rotate your phone to landscape for a bigger preview.</span>
        </div>

        {/* Preview cadre */}
        <div
          className="relative overflow-hidden rounded-lg"
          style={{
            width: 1920 * previewScale,
            height: 1080 * previewScale,
            border: "1px solid #4A2376",
          }}
        >
          <div
            className="pointer-events-none absolute right-3 top-3 z-10 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm"
            style={{ border: "1px solid #4A2376", background: "rgba(17, 8, 27, 0.7)", color: "#CAB0E8" }}
          >
            1920 × 1080
          </div>
          {downloading && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{ background: "rgba(17, 8, 27, 0.85)" }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
                <p className="text-sm font-medium text-muted-foreground">Exporting...</p>
              </div>
            </div>
          )}
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "top left",
              width: 1920,
              height: 1080,
            }}
          >
            <TrapScreenshotTemplate
              ref={templateRef}
              trap={trap}
              tierData={tierData}
              selectedPerks={selectedPerks}
              slots={slots}
              trapIconSrc={trapIconBase64 ?? unknownIconBase64 ?? weaponIconLarge(trap.icon, "traps")}
              baseStats={baseStats}
              modifiedStats={modifiedStats}
              qrSrc={qrDataUrl}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Template ───────────────────────────────────────────────────

interface TemplateProps {
  trap: TrapDetail
  tierData: TierData
  selectedPerks: Record<number, Perk | null>
  slots: PerkSlot[]
  trapIconSrc: string
  baseStats: TrapCalculatedStats
  modifiedStats: TrapCalculatedStats
  qrSrc: string | null
}

function TrapScreenshotTemplateInner(
  { trap, tierData, selectedPerks, slots, trapIconSrc, baseStats, modifiedStats, qrSrc }: TemplateProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const rarityColor = RARITY_TEXT[trap.rarity] ?? "text-gray-400"

  const baseRecord = baseStats as unknown as Record<string, number>
  const modifiedRecord = modifiedStats as unknown as Record<string, number>

  type Metric = { label: string; value: number; base: number; suffix?: string } | null
  const rawMetrics: Metric[] = [
    pickMetric("DPS", modifiedStats.dps, baseStats.dps),
    pickMetric("CRIT DPS", modifiedStats.critDps, baseStats.critDps),
    pickMetric("AVG DPS", modifiedStats.avgDps, baseStats.avgDps),
    null,
    pickMetric("HIT", modifiedStats.damage, baseStats.damage),
    pickMetric(
      "CRIT HIT",
      safeMul(modifiedStats.damage, modifiedStats.critDamageMultiplier),
      safeMul(baseStats.damage, baseStats.critDamageMultiplier),
    ),
    pickMetric("CRIT %", modifiedStats.critChance, baseStats.critChance, "%"),
    pickMetric("CRIT X", modifiedStats.critDamageMultiplier, baseStats.critDamageMultiplier, "%"),
  ]
  const dpsMetrics = compactSeparators(rawMetrics)

  const basicStatKeys = TRAP_SCREENSHOT_STATS.filter((k) => k in baseRecord)

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

      <div className="relative z-10 flex size-full gap-3 p-6">
        {/* Gauche : Header + DPS+Stats + Footer */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b px-2 pb-3" style={{ borderColor: "#4A2376" }}>
            <div className="flex items-center gap-4">
              <img src={trapIconSrc} alt={trap.name} className="size-24 object-contain" />
              <div>
                <p className="text-3xl font-bold uppercase leading-none">{trap.name}</p>
                <p className="mt-1 text-lg" style={{ color: "#CAB0E8" }}>
                  <span className={`font-semibold capitalize ${rarityColor}`}>{trap.rarity}</span>
                  {" / "}<span className="capitalize">{trap.placement}</span>
                  {" / "}<span className="capitalize">{trap.element}</span>
                  {" / "}<span className="capitalize">{tierData.displayTier}</span>
                </p>
              </div>
            </div>

            {/* Level + Offensive */}
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

            {/* Stats */}
            <div className="flex-1 overflow-hidden rounded-lg" style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}>
                <p className="text-lg font-semibold">Stat</p>
              </div>
              <div className="space-y-3 p-5">
                {basicStatKeys.map((key) => {
                  const baseVal = baseRecord[key] ?? 0
                  const modVal = modifiedRecord[key] ?? baseVal
                  const totalDelta = modVal - baseVal
                  const hasChange = Math.abs(totalDelta) > 0.01
                  const max = Math.max(STAT_MAX[key] ?? 0, modVal * 1.15, baseVal * 1.15, 1)
                  const pct = (n: number) => Math.max(0, Math.min((n / max) * 100, 100))
                  const baseW = pct(baseVal)
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
                        <div className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${Math.min(baseW, modW)}%`, background: "#9562D0" }} />
                        {totalDelta > 0 && (
                          <div className="absolute inset-y-0 rounded-sm bg-uncommon" style={{ left: `${baseW}%`, width: `${Math.max(0, modW - baseW)}%` }} />
                        )}
                        {totalDelta < 0 && (
                          <div className="absolute inset-y-0 rounded-sm bg-malus" style={{ left: `${modW}%`, width: `${Math.max(0, baseW - modW)}%` }} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
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

        {/* Col droite : Craft */}
        <div className="flex w-100 shrink-0 flex-col gap-3 overflow-hidden">
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

        {/* Right rail : Perks + QR */}
        <div className="flex w-87.5 shrink-0 flex-col gap-3">
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
                      <p className="mt-1.5 text-lg font-bold leading-tight text-white">{perk.description}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <ScreenshotQrCard qrSrc={qrSrc} />
        </div>
      </div>
    </div>
  )
}

const TrapScreenshotTemplate = React.forwardRef(TrapScreenshotTemplateInner)

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
