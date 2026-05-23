"use client"

import { useState } from "react"
import type { TrapDetail } from "@/lib/types/trap"
import { weaponIcon } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import { QrShareDialog } from "@/components/share/QrShareDialog"
import { Button } from "@/components/ui/button"
import { AssetImage } from "@/components/ui/asset-image"
import { Camera, Check, QrCode, Share2 } from "lucide-react"

interface TrapHeaderProps {
  trap: TrapDetail
  onShare: () => void
  copied: boolean
  onScreenshot: () => void
  // Path complet pour le QR (ex: "/fr/traps/floor-launcher?t=2&p0=PID")
  sharePath: string
  // URL absolue pour affichage + copy (https://...)
  shareUrl: string
}

export function TrapHeader({ trap, onShare, copied, onScreenshot, sharePath, shareUrl }: TrapHeaderProps) {
  const rarityColor = RARITY_TEXT[trap.rarity] ?? "text-muted-foreground"
  const [qrOpen, setQrOpen] = useState(false)

  return (
    <div className="border-b border-border/50 bg-background px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <AssetImage
            src={weaponIcon(trap.icon, "traps")}
            alt={trap.name}
            className="size-10 shrink-0 object-contain sm:size-12"
          />
          <div>
            <h1 className="text-lg font-bold uppercase leading-tight text-foreground sm:text-xl">
              {trap.name}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              <span className={`font-medium capitalize ${rarityColor}`}>{trap.rarity}</span>
              {" / "}
              <span className="capitalize">{trap.placement}</span>
              {" / "}
              <span className="capitalize">{trap.trapType}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button size="xs" variant="outline" onClick={onShare}>
            {copied ? <Check className="size-3" /> : <Share2 className="size-3" />}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
          </Button>
          <Button size="xs" variant="outline" onClick={() => setQrOpen(true)}>
            <QrCode className="size-3" />
            <span className="hidden sm:inline">QR</span>
          </Button>
          <Button size="xs" variant="outline" onClick={onScreenshot}>
            <Camera className="size-3" />
            <span className="hidden sm:inline">Screenshot</span>
          </Button>
        </div>
      </div>

      <QrShareDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        path={sharePath}
        fullUrl={shareUrl}
        title={trap.name}
        description="Scan or download to share this build"
      />
    </div>
  )
}
