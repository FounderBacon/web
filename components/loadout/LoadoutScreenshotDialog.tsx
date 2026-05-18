"use client"

import { Camera, Download, XIcon } from "lucide-react"
import { domToJpeg } from "modern-screenshot"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { ScreenshotQrCard } from "@/components/share/screenshot/ScreenshotQrCard"
import { usePreviewScale } from "@/components/share/screenshot/usePreviewScale"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { qrUrl } from "@/lib/api/qr"
import { perkIcon, teamPerkIcon, UNKNOWN_ICON } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import type { LoadoutHeroSlot, LoadoutTeamPerk } from "@/lib/loadout/store"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  commander: LoadoutHeroSlot | null
  support: (LoadoutHeroSlot | null)[]
  teamPerks: LoadoutTeamPerk[]
  offensive: number
  // Path (avec query params) pour le QR — sera concatene cote back avec WEB_PUBLIC_URL
  sharePath: string
}

export function LoadoutScreenshotDialog({
  open,
  onOpenChange,
  commander,
  support,
  teamPerks,
  offensive,
  sharePath,
}: Props) {
  const templateRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const previewScale = usePreviewScale(open)
  const [loadoutIcons, setLoadoutIcons] = useState<Record<string, string>>({})
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [unknownIconBase64, setUnknownIconBase64] = useState<string | null>(null)

  // ── Pre-charge des icones du loadout en base64 ────────────────
  // (le CDN n'est pas CORS-friendly donc domToJpeg echouerait avec des URL directes)
  useEffect(() => {
    if (!open) return
    let cancelled = false

    // Fallback unknown
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

    if (urls.size === 0) {
      setLoadoutIcons({})
      return
    }
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

  // QR en data URL (le back retourne du SVG)
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
    if (sharePath && !qrDataUrl) return false
    return true
  }, [unknownIconBase64, qrDataUrl, sharePath])

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
      link.download = `hero-loadout.jpg`
      link.href = dataUrl
      link.click()
    } catch {
      // silent
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-fit max-w-[95vw] gap-0 overflow-hidden bg-king-900 p-5 sm:max-w-[95vw]"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}
            >
              <Camera className="size-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-base font-semibold leading-tight">
                Screenshot Preview
              </DialogTitle>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: "#9562D0" }}>
                Ready to share
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleDownload} disabled={downloading || !assetsReady}>
              <Download className="size-3.5" />
              {!assetsReady ? "Loading..." : downloading ? "Exporting..." : "Download JPG"}
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => onOpenChange(false)}>
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* Preview cadre : dimensions dynamiques (viewport-fit) via usePreviewScale */}
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
            style={{
              border: "1px solid #4A2376",
              background: "rgba(17, 8, 27, 0.7)",
              color: "#CAB0E8",
            }}
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
              <LoadoutTemplate
                ref={templateRef}
                commander={commander}
                support={support}
                teamPerks={teamPerks}
                offensive={offensive}
                loadoutIcons={loadoutIcons}
                unknownIconSrc={unknownIconBase64}
                qrSrc={qrDataUrl}
              />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Template (1920x1080) ──────────────────────────────────────────

interface TemplateProps {
  commander: LoadoutHeroSlot | null
  support: (LoadoutHeroSlot | null)[]
  teamPerks: LoadoutTeamPerk[]
  offensive: number
  loadoutIcons: Record<string, string>
  unknownIconSrc: string | null
  qrSrc: string | null
}

function LoadoutTemplateInner(
  { commander, support, teamPerks, offensive, loadoutIcons, unknownIconSrc, qrSrc }: TemplateProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const filledSupport = support.filter((s): s is LoadoutHeroSlot => s !== null)
  const hasAny = !!commander || filledSupport.length > 0 || teamPerks.length > 0 || offensive > 0
  const resolveIcon = (url: string) => loadoutIcons[url] ?? unknownIconSrc ?? url
  const commanderRarityColor = commander ? RARITY_TEXT[commander.rarity] ?? "text-foreground" : ""

  return (
    <div
      ref={ref}
      className="relative overflow-hidden font-sans"
      style={{ width: 1920, height: 1080, color: "#F2EBF9" }}
    >
      <img src="/bg_plan.jpg" alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0" style={{ background: "rgba(17, 8, 27, 0.78)" }} />

      <div className="relative z-10 flex size-full flex-col gap-4 p-8">
        {/* ── Header ───────────────────────────────────────────── */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-2 pb-4"
          style={{ borderColor: "#4A2376" }}
        >
          <div className="flex items-center gap-4">
            <FbcnLogo className="size-12" fill="#F2EBF9" />
            <div className="flex flex-col">
              <p className="text-4xl font-bold uppercase leading-none tracking-wide">Hero Loadout</p>
              <p className="mt-1.5 text-sm uppercase tracking-[0.3em]" style={{ color: "#9562D0" }}>
                Save the World · Combined Bonuses
              </p>
            </div>
          </div>

          {/* F.O.R.T. offensive panel */}
          <div
            className="flex items-stretch overflow-hidden rounded-lg"
            style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}
          >
            <div className="flex flex-col items-center justify-center px-8 py-3">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.25em]"
                style={{ color: "#9562D0" }}
              >
                F.O.R.T. Offensive
              </span>
              <span className="text-3xl font-bold tabular-nums leading-tight text-white">
                +{offensive}
              </span>
            </div>
          </div>
        </div>

        {/* ── Body : 3 cols (Commander | Support | TeamPerks+QR) ── */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* ── Commander ─────────────────────────────────────── */}
          <div
            className="flex w-110 shrink-0 flex-col overflow-hidden rounded-lg"
            style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}
          >
            <div
              className="px-5 py-3"
              style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}
            >
              <p className="text-lg font-semibold">Commander</p>
            </div>
            {commander ? (
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <img
                    src={resolveIcon(commander.heroIconUrl)}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base uppercase tracking-wider" style={{ color: "#CAB0E8" }}>
                    {commander.heroName}
                  </p>
                </div>
                <div
                  className="flex items-start gap-3 rounded p-3"
                  style={{ background: "rgba(74, 35, 118, 0.4)" }}
                >
                  <img
                    src={resolveIcon(perkIcon(commander.perkName))}
                    alt=""
                    className="size-10 shrink-0 object-contain"
                  />
                  <p className={`text-lg font-bold leading-snug ${commanderRarityColor}`}>
                    {commander.perkDescription}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState label="No commander" />
            )}
          </div>

          {/* ── Support team ──────────────────────────────────── */}
          <div
            className="flex flex-1 flex-col overflow-hidden rounded-lg"
            style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}
            >
              <p className="text-lg font-semibold">Support team</p>
              <span
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "#CAB0E8" }}
              >
                {filledSupport.length}<span style={{ color: "#6E767A" }}> / 5</span>
              </span>
            </div>
            {filledSupport.length === 0 ? (
              <EmptyState label="No support heroes" />
            ) : (
              <div className="flex flex-1 flex-col gap-2 p-4">
                {filledSupport.map((s, i) => (
                  <div
                    key={`${s.heroSlug}-${i}`}
                    className="flex items-start gap-3 rounded p-3"
                    style={{ background: "rgba(74, 35, 118, 0.4)" }}
                  >
                    <div className="relative size-16 shrink-0">
                      <img
                        src={resolveIcon(s.heroIconUrl)}
                        alt=""
                        className="absolute inset-0 size-full rounded object-cover"
                      />
                      <img
                        src={resolveIcon(perkIcon(s.perkName))}
                        alt=""
                        className="absolute bottom-0 right-0 size-7 rounded object-contain"
                        style={{
                          background: "rgba(17, 8, 27, 0.9)",
                          border: "1px solid #4A2376",
                        }}
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="truncate text-xs leading-tight" style={{ color: "#CAB0E8" }}>
                        {s.heroName} · <span className="capitalize">{s.rarity}</span>
                      </p>
                      <p className="line-clamp-2 text-sm font-bold leading-snug text-white">
                        {s.perkDescription}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Team perks + QR ───────────────────────────────── */}
          <div className="flex w-100 shrink-0 flex-col gap-4">
            <div
              className="flex flex-1 flex-col overflow-hidden rounded-lg"
              style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}
            >
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid #4A2376", background: "#31174F" }}
              >
                <p className="text-lg font-semibold">Team perks</p>
                <span
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "#CAB0E8" }}
                >
                  {teamPerks.length}
                </span>
              </div>
              {teamPerks.length === 0 ? (
                <EmptyState label="No team perks" compact />
              ) : (
                <div className="flex flex-col gap-2 p-4">
                  {teamPerks.map((p) => (
                    <div
                      key={p.perkId}
                      className="flex items-start gap-3 rounded p-3"
                      style={{ background: "rgba(74, 35, 118, 0.4)" }}
                    >
                      <img
                        src={resolveIcon(teamPerkIcon(p.name))}
                        alt=""
                        className="size-10 shrink-0 object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold leading-tight text-white">
                          {p.name}
                        </p>
                        <p
                          className="line-clamp-3 text-xs leading-snug"
                          style={{ color: "#CAB0E8" }}
                        >
                          {p.description ?? p.requirements}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QR : card a taille fixe partagee avec weapons */}
            <ScreenshotQrCard qrSrc={qrSrc} title="Share loadout" />
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div
          className="flex h-16 shrink-0 items-center justify-between gap-4 overflow-hidden rounded-lg px-6"
          style={{ border: "1px solid #4A2376", background: "rgba(49, 23, 79, 0.4)" }}
        >
          <div className="flex items-center gap-3">
            <FbcnLogo className="size-9" fill="#F2EBF9" />
            <div className="flex flex-col">
              <span className="text-lg font-bold uppercase leading-none tracking-widest text-white">
                FounderBacon
              </span>
              <span
                className="mt-1 text-[10px] uppercase tracking-[0.3em]"
                style={{ color: "#9562D0" }}
              >
                Save the World Companion
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: "#CAB0E8" }}>
              {hasAny ? "Loadout active" : "Empty loadout"}
            </span>
            <span className="text-sm font-bold uppercase tracking-widest text-white">
              founderbacon.com
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const LoadoutTemplate = React.forwardRef(LoadoutTemplateInner)

function EmptyState({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <div className={`flex flex-1 items-center justify-center ${compact ? "py-6" : "py-10"}`}>
      <p className="text-base" style={{ color: "#6E767A" }}>
        {label}
      </p>
    </div>
  )
}
