"use client"

import type { TrapDetail } from "@/lib/types/trap"
import { weaponIcon } from "@/lib/cdn"
import { RARITY_TEXT } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { AssetImage } from "@/components/ui/asset-image"
import { Share2, Check } from "lucide-react"

interface TrapHeaderProps {
  trap: TrapDetail
  onShare: () => void
  copied: boolean
}

export function TrapHeader({ trap, onShare, copied }: TrapHeaderProps) {
  const rarityColor = RARITY_TEXT[trap.rarity] ?? "text-muted-foreground"

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
        </div>
      </div>
    </div>
  )
}
