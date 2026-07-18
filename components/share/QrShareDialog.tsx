"use client"

import { Check, Copy, Download, Image as ImageIcon, ImageDown, QrCode } from "lucide-react"
import { domToPng } from "modern-screenshot"
import React, { useEffect, useRef, useState } from "react"
import { qrUrl } from "@/lib/api/qr"
import { FbcnLogo } from "@/components/svg/FbcnLogo"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type PreviewMode = "branded" | "raw"

interface QrShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Chemin (avec query params eventuels) — sera concatene a WEB_PUBLIC_URL cote back
  path: string
  // URL complete affichee + copiee dans le clipboard (https://...)
  fullUrl: string
  title?: string
  description?: string
}

export function QrShareDialog({
  open,
  onOpenChange,
  path,
  fullUrl,
  title = "Share via QR",
  description,
}: QrShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)
  const [mode, setMode] = useState<PreviewMode>("raw")
  // Object URL du PNG raw — sert pour la preview "raw" + le QR du template branded
  const [rawPngUrl, setRawPngUrl] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [copyingImage, setCopyingImage] = useState(false)
  const brandedRef = useRef<HTMLDivElement>(null)
  // Container du preview branded : on mesure sa largeur pour scaler le template 600x800
  // dynamiquement (sinon le 300x400 fixe deborde sur petits mobiles)
  const brandedContainerRef = useRef<HTMLDivElement>(null)
  const [brandedScale, setBrandedScale] = useState(0.5)

  useEffect(() => {
    if (!open || mode !== "branded") return
    const el = brandedContainerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width
      if (width > 0) setBrandedScale(width / 600)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [open, mode])

  // Pre-charge le PNG raw une fois la dialog ouverte
  useEffect(() => {
    if (!open) return
    let cancelled = false
    let createdUrl: string | null = null
    setRawPngUrl(null)

    fetch(qrUrl(path, 512, "png"))
      .then((res) => {
        if (!res.ok) throw new Error(`QR fetch ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        createdUrl = URL.createObjectURL(blob)
        setRawPngUrl(createdUrl)
      })
      .catch(() => {
        // silent
      })

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [open, path])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // silent
    }
  }

  async function handleDownload() {
    if (!rawPngUrl) return
    setDownloading(true)
    try {
      const filename = `${slugFromPath(path)}-qr.png`
      if (mode === "raw") {
        triggerDownload(rawPngUrl, filename)
      } else {
        if (!brandedRef.current) return
        const dataUrl = await domToPng(brandedRef.current, {
          width: 600,
          height: 800,
          scale: 2,
        })
        triggerDownload(dataUrl, filename)
      }
    } catch {
      // silent
    } finally {
      setDownloading(false)
    }
  }

  // Copie l'image (raw ou branded) dans le presse-papier en PNG
  async function handleCopyImage() {
    if (!rawPngUrl) return
    setCopyingImage(true)
    try {
      let blob: Blob | null = null
      if (mode === "raw") {
        const res = await fetch(rawPngUrl)
        blob = await res.blob()
      } else if (brandedRef.current) {
        const dataUrl = await domToPng(brandedRef.current, {
          width: 600,
          height: 800,
          scale: 2,
        })
        const res = await fetch(dataUrl)
        blob = await res.blob()
      }
      if (!blob) return
      // Force le mime type a image/png pour la compatibilite clipboard
      const pngBlob = blob.type === "image/png" ? blob : new Blob([await blob.arrayBuffer()], { type: "image/png" })
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })])
      setCopiedImage(true)
      setTimeout(() => setCopiedImage(false), 2000)
    } catch {
      // silent (browser sans support ClipboardItem ou permission refusee)
    } finally {
      setCopyingImage(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] gap-4 bg-king-900 p-4 sm:max-w-md sm:p-5">
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>

        {/* Toggle preview */}
        <div className="grid grid-cols-2 gap-1 rounded-md bg-card/40 p-1">
          <ToggleButton active={mode === "raw"} onClick={() => setMode("raw")}>
            <QrCode className="size-3.5" />
            QR only
          </ToggleButton>
          <ToggleButton active={mode === "branded"} onClick={() => setMode("branded")}>
            <ImageIcon className="size-3.5" />
            Branded
          </ToggleButton>
        </div>

        {/* Preview */}
        <div className="relative flex justify-center overflow-hidden rounded-lg bg-card/20 p-3">
          {!rawPngUrl ? (
            <div className="flex aspect-square w-full items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          ) : mode === "raw" ? (
            <div className="flex aspect-square w-full items-center justify-center rounded bg-white p-4">
              <img src={rawPngUrl} alt="QR code" className="size-full" />
            </div>
          ) : (
            // Container auto-scale : w-full max-w-[300px] avec aspect 3/4
            // Le template 600x800 est scale via ResizeObserver pour matcher la largeur reelle
            <div
              ref={brandedContainerRef}
              className="aspect-[3/4] w-full max-w-[300px] overflow-hidden"
            >
              <div style={{ transform: `scale(${brandedScale})`, transformOrigin: "top left", width: 600, height: 800 }}>
                <BrandedTemplate ref={brandedRef} qrSrc={rawPngUrl} title={title} />
              </div>
            </div>
          )}
        </div>

        {/* URL + actions */}
        <div className="flex flex-col gap-2">
          <p className="break-all rounded border border-border/50 bg-card/40 px-3 py-2 text-[11px] text-muted-foreground">
            {fullUrl}
          </p>
          {/* Boutons : grille 2 cols mobile (Copy URL + Copy image en row, Download full width dessous),
              row plate a partir de sm. Mieux que 3 stack vertical (trop chargé) et meilleur tap target que 3 en row sur mobile */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
            <Button size="sm" variant="outline" onClick={handleCopy} className="sm:flex-1">
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy URL"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyImage} disabled={!rawPngUrl || copyingImage} className="sm:flex-1">
              {copiedImage ? <Check className="size-3.5" /> : <ImageIcon className="size-3.5" />}
              {copiedImage ? "Copied" : copyingImage ? "..." : "Copy image"}
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={!rawPngUrl || downloading} className="col-span-2 sm:col-span-1 sm:flex-1">
              <ImageDown className="size-3.5" />
              {downloading ? "..." : "Download"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}

// Template du PNG telecharge en mode "branded" (rendu offscreen + capture par modern-screenshot)
const BrandedTemplate = React.forwardRef<HTMLDivElement, { qrSrc: string; title: string }>(
  function BrandedTemplate({ qrSrc, title }, ref) {
    return (
      <div
        ref={ref}
        className="relative flex flex-col items-center font-sans"
        style={{ width: 600, height: 800, color: "#F2EBF9", background: "#11081B" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1A0E2E 0%, #11081B 100%)" }} />

        <div className="relative z-10 flex size-full flex-col items-center justify-between p-10">
          {/* Header : logo + brand */}
          <div className="flex items-center gap-3">
            <FbcnLogo className="size-10" fill="#F2EBF9" />
            <span className="text-xl font-bold uppercase tracking-widest text-white">FounderBacon</span>
          </div>

          {/* QR code centre */}
          <div className="flex flex-col items-center gap-4">
            <p className="line-clamp-2 max-w-md text-center text-2xl font-bold uppercase leading-tight">{title}</p>
            <div className="rounded-xl bg-white p-5" style={{ boxShadow: "0 8px 32px rgba(149, 98, 208, 0.4)" }}>
              <img src={qrSrc} alt="" style={{ width: 320, height: 320, display: "block" }} />
            </div>
            <p className="text-sm" style={{ color: "#CAB0E8" }}>Scan to view</p>
          </div>

          {/* Footer : tagline + url courte */}
          <div className="flex w-full flex-col items-center gap-1">
            <p className="text-base font-bold uppercase tracking-[0.3em] text-white">founderbacon.com</p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "#9562D0" }}>
              Free Save the World companion
            </p>
          </div>
        </div>
      </div>
    )
  },
)

// ── Helpers ────────────────────────────────────────────────────

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a")
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function slugFromPath(path: string): string {
  const clean = path.split("?")[0].replace(/^\/+|\/+$/g, "")
  return clean.replace(/\//g, "-") || "qr"
}
